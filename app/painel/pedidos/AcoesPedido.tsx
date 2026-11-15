/* Botões do pedido: andamento (status), agendamento com aviso de capacidade e mensagens de WhatsApp. */
"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/auth";
import { dataBR } from "@/lib/datas";
import { linkWhatsApp } from "@/lib/pedido";
import { preencher, proximoStatus, ROTULO, STATUS, STATUS_MARCENEIRO, type Status } from "@/lib/status";
import { agendarPedido, mudarStatus, sugerirDia } from "../actions";

interface Props {
  id: number;
  numero: string;
  status: Status;
  nome: string | null;
  telefone: string | null;
  bancos: number;
  dataAgendada: string | null;
  dataDesejada: string | null;
  papel: Papel;
  mensagens: Record<string, string>;
}

export default function AcoesPedido(p: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [msg, setMsg] = useState<{ tipo: "erro" | "aviso" | "ok"; texto: string } | null>(null);
  const [data, setData] = useState(p.dataAgendada ?? p.dataDesejada ?? "");
  const [forcar, setForcar] = useState(false);

  const permitidos = p.papel === "marceneiro" ? STATUS_MARCENEIRO : STATUS;
  const proximo = proximoStatus(p.status);

  const trocarStatus = (s: Status) =>
    iniciar(async () => {
      const r = await mudarStatus(p.id, s);
      if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro });
      setMsg({ tipo: "ok", texto: `Status: ${ROTULO[s]}` });
      router.refresh();
    });

  const agendar = (forca: boolean) =>
    iniciar(async () => {
      const r = await agendarPedido(p.id, data || null, forca);
      if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro });
      if (r.aviso) {
        setForcar(true);
        return setMsg({ tipo: "aviso", texto: r.aviso });
      }
      setForcar(false);
      setMsg({ tipo: "ok", texto: data ? `Agendado para ${dataBR(data)}` : "Agendamento removido" });
      router.refresh();
    });

  const sugerir = () =>
    iniciar(async () => {
      const r = await sugerirDia(p.bancos);
      if (r.data) {
        setData(r.data);
        setForcar(false);
        setMsg({ tipo: "ok", texto: `Próximo dia com vaga: ${dataBR(r.data)}` });
      } else setMsg({ tipo: "erro", texto: "Não achei vaga nos próximos meses." });
    });

  const zap = (chave: string, texto?: string) => linkWhatsApp(texto ?? preencher(p.mensagens[chave] ?? "", { nome: p.nome, numero: p.numero, data: data || p.dataAgendada }), p.telefone);

  return (
    <div className="p-card">
      <h2>Andamento</h2>
      <div className="p-botoes">
        {proximo && permitidos.includes(proximo) && (
          <button className="p-btn laranja" disabled={pendente} onClick={() => trocarStatus(proximo)}>Avançar: {ROTULO[proximo]}</button>
        )}
        <select aria-label="Mudar status" value={p.status} disabled={pendente} onChange={(e) => trocarStatus(e.target.value as Status)} style={{ width: "auto", flex: 1, minWidth: 160 }}>
          {permitidos.map((s) => <option key={s} value={s}>{ROTULO[s]}</option>)}
          {!permitidos.includes(p.status) && <option value={p.status}>{ROTULO[p.status]}</option>}
        </select>
      </div>

      <h2>Data de produção / entrega</h2>
      <div className="p-form">
        <input type="date" value={data} onChange={(e) => { setData(e.target.value); setForcar(false); setMsg(null); }} />
        <div className="p-botoes">
          <button className="p-btn claro" disabled={pendente} onClick={sugerir}>Sugerir dia com vaga</button>
          <button className="p-btn" disabled={pendente} onClick={() => agendar(forcar)}>{forcar ? "Agendar mesmo assim" : "Agendar"}</button>
        </div>
      </div>

      {msg && <p className={msg.tipo === "erro" ? "p-erro" : msg.tipo === "aviso" ? "p-aviso" : "p-ok"}>{msg.texto}</p>}

      {p.telefone ? (
        <>
          <h2>Mandar mensagem no WhatsApp</h2>
          <div className="p-botoes">
            <a className="p-btn verde" target="_blank" rel="noopener" href={zap("confirmado")}>Confirmar data</a>
            <a className="p-btn verde" target="_blank" rel="noopener" href={zap("pronto")}>Está pronto</a>
            <a className="p-btn verde" target="_blank" rel="noopener" href={zap("saiu_entrega")}>Saindo para entrega</a>
            <a className="p-btn verde" target="_blank" rel="noopener" href={zap("proposta")}>Propor data</a>
          </div>
        </>
      ) : (
        <p className="p-aviso">Cadastre o telefone do cliente (Editar) para mandar mensagens.</p>
      )}

      {p.papel !== "marceneiro" && p.status !== "cancelado" && (
        <button className="p-btn vermelho" disabled={pendente} onClick={() => confirm("Cancelar este pedido?") && trocarStatus("cancelado")}>Cancelar pedido</button>
      )}
    </div>
  );
}
