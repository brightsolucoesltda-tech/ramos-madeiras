/* Lista de clientes para avisar, com um botão grande de WhatsApp por cliente. */
"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/auth";
import { dataCurta } from "@/lib/datas";
import { linkWhatsApp } from "@/lib/pedido";
import { preencher, STATUS_MARCENEIRO, type Status } from "@/lib/status";
import { avisoEnviado } from "../actions";

export type Grupo = "hoje" | "pronto" | "producao" | "confirmar" | "data";
export interface LinhaAviso {
  id: number;
  numero: string;
  status: string;
  nome: string | null;
  telefone: string | null;
  bairro: string | null;
  itens: string;
  data: string | null;
  dataSugerida: string;
  avisos: Record<string, string>;
}

// Botões de cada grupo: tipo da mensagem, texto do botão e (opcional) status que muda junto
type Botao = { tipo: string; texto: string; status?: Status; destaque?: boolean };
const GRUPOS: { id: Grupo; titulo: string; dica: string; botoes: Botao[] }[] = [
  { id: "hoje", titulo: "🚚 Entregas de hoje", dica: "Avise que está saindo para entregar.", botoes: [{ tipo: "saiu_entrega", texto: "Saindo para entrega", status: "saiu_entrega", destaque: true }] },
  { id: "pronto", titulo: "✅ Prontos", dica: "Avise que o banco está pronto.", botoes: [{ tipo: "pronto", texto: "Avisar que está pronto", destaque: true }] },
  {
    id: "producao", titulo: "🔨 Em produção", dica: "Avise que está sendo feito, ou marque como pronto e avise de uma vez.",
    botoes: [{ tipo: "pronto", texto: "Marcar pronto e avisar", status: "pronto", destaque: true }, { tipo: "em_producao", texto: "Avisar: em produção" }],
  },
  {
    id: "confirmar", titulo: "📅 Confirmar data", dica: "Confirme a data combinada com o cliente.",
    botoes: [{ tipo: "confirmado", texto: "Confirmar data", destaque: true }, { tipo: "em_producao", texto: "Começar produção e avisar", status: "em_producao" }],
  },
  { id: "data", titulo: "🗓️ Esperando data", dica: "Escolha a data e proponha ao cliente.", botoes: [{ tipo: "proposta", texto: "Propor data", destaque: true }] },
];

const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ListaAvisos({ grupos, mensagens, papel }: { grupos: Record<Grupo, LinhaAviso[]>; mensagens: Record<string, string>; papel: Papel }) {
  const total = Object.values(grupos).reduce((s, g) => s + g.length, 0);
  if (!total) return <p className="p-card">Nenhum pedido em andamento para avisar. 🎉</p>;
  return (
    <>
      {GRUPOS.filter((g) => grupos[g.id].length).map((g) => {
        // Quem ainda não foi avisado aparece primeiro
        const tipoPrincipal = g.botoes[0].tipo;
        const linhas = [...grupos[g.id]].sort((a, b) => Number(!!a.avisos[tipoPrincipal]) - Number(!!b.avisos[tipoPrincipal]));
        const faltam = linhas.filter((l) => !l.avisos[tipoPrincipal]).length;
        return (
          <section key={g.id} className="p-lista">
            <h2>{g.titulo} · {faltam ? `${faltam} para avisar` : "todos avisados"}</h2>
            <small>{g.dica}</small>
            {linhas.map((l) => <Linha key={l.id} l={l} botoes={g.botoes} mensagens={mensagens} papel={papel} />)}
          </section>
        );
      })}
    </>
  );
}

function Linha({ l, botoes, mensagens, papel }: { l: LinhaAviso; botoes: Botao[]; mensagens: Record<string, string>; papel: Papel }) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [dataProposta, setDataProposta] = useState(l.dataSugerida);
  const [erro, setErro] = useState("");
  const avisadoPrincipal = l.avisos[botoes[0].tipo];

  const link = (b: Botao) => {
    const data = b.tipo === "proposta" ? dataProposta : l.data;
    return linkWhatsApp(preencher(mensagens[b.tipo] ?? "", { nome: l.nome, numero: l.numero, data }), l.telefone);
  };
  // O link abre na hora (para não ser bloqueado); o registro do aviso é gravado em seguida
  const registrar = (b: Botao) =>
    iniciar(async () => {
      const r = await avisoEnviado(l.id, b.tipo, b.status, b.tipo === "proposta" ? dataProposta : undefined);
      if (!r.ok) setErro(r.erro);
      router.refresh();
    });

  return (
    <div className={`p-item st-${l.status}`} style={{ opacity: avisadoPrincipal ? 0.62 : 1 }}>
      <div className="linha">
        <b>{l.nome ?? "Cliente"} <small>#{l.numero}</small></b>
        {avisadoPrincipal && <span className="p-badge pronto">✓ avisado {hora(avisadoPrincipal)}</span>}
      </div>
      <small>{l.itens} · {l.bairro ?? "—"}{l.data ? ` · ${dataCurta(l.data)}` : ""}</small>

      {!l.telefone ? (
        <p className="p-aviso">Sem WhatsApp cadastrado. <Link href={`/painel/pedidos/${l.id}?editar=1`}>Cadastrar telefone</Link></p>
      ) : (
        <>
          {botoes[0].tipo === "proposta" && (
            <label className="p-form" style={{ gap: 4 }}>
              <small>Data para propor</small>
              <input type="date" value={dataProposta} onChange={(e) => setDataProposta(e.target.value)} />
            </label>
          )}
          <div className="p-botoes">
            {botoes
              .filter((b) => !b.status || papel !== "marceneiro" || STATUS_MARCENEIRO.includes(b.status))
              .map((b) => (
                <a
                  key={b.tipo + (b.status ?? "")}
                  className={`p-btn ${b.destaque ? "verde" : "claro"}`}
                  style={{ flex: b.destaque ? "1 1 100%" : undefined, padding: b.destaque ? "15px 18px" : undefined, fontSize: b.destaque ? "1.05rem" : undefined }}
                  href={link(b)}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={pendente || (b.tipo === "proposta" && !dataProposta)}
                  onClick={(e) => {
                    if (b.tipo === "proposta" && !dataProposta) return e.preventDefault();
                    registrar(b);
                  }}
                >
                  {b.destaque ? "💬 " : ""}{b.texto}
                </a>
              ))}
          </div>
        </>
      )}
      {erro && <p className="p-erro">{erro}</p>}
    </div>
  );
}
