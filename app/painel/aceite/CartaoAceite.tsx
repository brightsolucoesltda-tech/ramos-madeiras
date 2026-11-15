/* Cartão de um pedido no aceite: Aceitar, Propor outra data ou Recusar — e depois o WhatsApp pronto para o cliente. */
"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { dataBR, dataCurta } from "@/lib/datas";
import { linkWhatsApp } from "@/lib/pedido";
import { preencher } from "@/lib/status";
import { aceitarData, avisoEnviado, clienteAceitouProposta, proporOutraData, recusarData } from "../actions";

interface Props {
  p: {
    id: number; numero: string; status: string; aceite: string; nome: string | null; telefone: string | null; bairro: string | null;
    itens: string; bancos: number; dataPedida: string | null; dataProposta: string | null;
  };
  ocupacao: Record<string, string>;
  sugestao: string;
  mensagens: Record<string, string>;
  podeDecidir: boolean;
}

export default function CartaoAceite({ p, ocupacao, sugestao, mensagens, podeDecidir }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [modo, setModo] = useState<"" | "propor">("");
  const [novaData, setNovaData] = useState(p.dataProposta ?? sugestao);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  // Depois de decidir, mostra o botão de WhatsApp com a mensagem certa
  const [whats, setWhats] = useState<{ tipo: "confirmado" | "proposta"; data: string } | null>(null);

  const aceitar = (forcar: boolean) =>
    iniciar(async () => {
      setErro("");
      const r = await aceitarData(p.id, forcar);
      if (!r.ok) return setErro(r.erro);
      if (r.aviso) return setAviso(r.aviso);
      setAviso("");
      setWhats({ tipo: "confirmado", data: r.data! });
      // Só recarrega já se não houver WhatsApp; senão espera o toque no botão verde (para ele não sumir)
      if (!p.telefone) router.refresh();
    });
  const propor = () =>
    iniciar(async () => {
      setErro("");
      const r = await proporOutraData(p.id, novaData);
      if (!r.ok) return setErro(r.erro);
      setModo("");
      setWhats({ tipo: "proposta", data: novaData });
      if (!p.telefone) router.refresh();
    });
  const recusar = () => {
    if (!confirm("Recusar esta data? O vendedor vai combinar outra com o cliente.")) return;
    iniciar(async () => {
      const r = await recusarData(p.id);
      if (!r.ok) setErro(r.erro);
      router.refresh();
    });
  };
  const clienteAceitou = () =>
    iniciar(async () => {
      const r = await clienteAceitouProposta(p.id);
      if (!r.ok) setErro(r.erro);
      router.refresh();
    });

  const linkZap = whats && linkWhatsApp(preencher(mensagens[whats.tipo] ?? "", { nome: p.nome, numero: p.numero, data: whats.data }), p.telefone);
  const estado =
    p.aceite === "proposto" ? <span className="p-badge reagendado">📅 Proposto {p.dataProposta ? dataBR(p.dataProposta) : ""}</span>
    : p.aceite === "recusado" ? <span className="p-badge cancelado">❌ Recusado</span>
    : <span className="p-badge novo">⏳ Aguardando</span>;

  return (
    <div className={`p-item st-${p.status}`}>
      <div className="linha">
        <Link href={`/painel/pedidos/${p.id}`} style={{ color: "inherit" }}><b>{p.nome ?? "Cliente"} <small>#{p.numero}</small></b></Link>
        {estado}
      </div>
      <small>{p.itens} ({p.bancos} banco{p.bancos > 1 ? "s" : ""}) · {p.bairro ?? "—"}</small>
      <div style={{ fontWeight: 600 }}>
        Data pedida: {p.dataPedida ? <>{dataCurta(p.dataPedida)} <small>· agenda {ocupacao[p.dataPedida] ?? "—"} bancos</small></> : <small>sem data</small>}
      </div>

      {aviso && (
        <div className="p-aviso">
          {aviso}
          <div className="p-botoes" style={{ marginTop: 8 }}>
            <button className="p-btn laranja" disabled={pendente} onClick={() => aceitar(true)}>Aceitar mesmo assim (encaixe)</button>
            <button className="p-btn claro" onClick={() => { setAviso(""); setModo("propor"); }}>Propor outra data</button>
          </div>
        </div>
      )}

      {whats ? (
        p.telefone ? (
          <a className="p-btn verde" style={{ padding: "15px 18px", fontSize: "1.05rem" }} href={linkZap!} target="_blank" rel="noopener"
            onClick={() => avisoEnviado(p.id, whats.tipo).then(() => router.refresh())}>
            💬 {whats.tipo === "confirmado" ? "Confirmar data com o cliente" : `Propor ${dataBR(whats.data)} ao cliente`}
          </a>
        ) : (
          <p className="p-aviso">Feito! Cliente sem WhatsApp cadastrado — <Link href={`/painel/pedidos/${p.id}?editar=1`}>cadastrar</Link>.</p>
        )
      ) : podeDecidir && p.aceite === "pendente" && !aviso ? (
        modo === "propor" ? (
          <div className="p-form">
            <label>Nova data<input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} /></label>
            {novaData && <small>Agenda nesse dia: {ocupacao[novaData] ?? "—"} bancos</small>}
            <div className="p-botoes">
              <button className="p-btn laranja" disabled={pendente || !novaData} onClick={propor}>Propor esta data</button>
              <button className="p-btn claro" onClick={() => setModo("")}>Voltar</button>
            </div>
          </div>
        ) : (
          <div className="p-botoes">
            {p.dataPedida && <button className="p-btn laranja" style={{ flex: "1 1 100%" }} disabled={pendente} onClick={() => aceitar(false)}>✅ Aceitar {dataCurta(p.dataPedida)}</button>}
            <button className="p-btn claro" style={{ flex: 1 }} disabled={pendente} onClick={() => setModo("propor")}>📅 Propor outra</button>
            <button className="p-btn vermelho" style={{ flex: 1 }} disabled={pendente} onClick={recusar}>❌ Recusar</button>
          </div>
        )
      ) : p.aceite === "proposto" ? (
        <button className="p-btn claro" disabled={pendente} onClick={clienteAceitou}>👍 Cliente aceitou {p.dataProposta ? dataBR(p.dataProposta) : ""}</button>
      ) : null}
      {erro && <p className="p-erro">{erro}</p>}
    </div>
  );
}
