/* Produção e viagens do dia.
   A rota é uma SUGESTÃO: o patrão (admin/marceneiro) aprova como está ou edita (↑ ↓, começar por outro bairro) e aprova.
   O vendedor só vê. Qualquer edição desfaz a aprovação. */
"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/auth";
import { normalizar } from "@/lib/geo";
import { linkWhatsApp } from "@/lib/pedido";
import { dividirViagens, linkGoogleMaps, type Parada } from "@/lib/rotas";
import { preencher, ROTULO, type Status } from "@/lib/status";
import { aprovarRota, avisoEnviado, limparOrdemRota, mudarStatus, salvarOrdemRota } from "../actions";

interface Props {
  paradasIniciais: Parada[];
  manual: boolean;
  bancosPorViagem: number;
  horasPorBanco: number;
  base: { endereco: string; lat: number; lng: number };
  mensagens: Record<string, string>;
  papel: Papel;
  dia: string;
  aprovada: { em: string; por: string } | null;
  mudouDepois: boolean;
  podeEditar: boolean;
}

const hora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ViagensDia(props: Props) {
  const { paradasIniciais, manual, bancosPorViagem, horasPorBanco, base, mensagens, papel, dia, podeEditar } = props;
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [ordem, setOrdem] = useState(paradasIniciais);
  const [ordemManual, setOrdemManual] = useState(manual);
  const [editando, setEditando] = useState(false);
  const [editadoAgora, setEditadoAgora] = useState(false); // mexeu na rota nesta tela (aprovação caiu)
  const [erro, setErro] = useState("");
  const viagens = useMemo(() => dividirViagens(ordem, bancosPorViagem), [ordem, bancosPorViagem]);
  const horas = (b: number) => `${(b * horasPorBanco).toString().replace(".", ",")}h`;
  const aprovada = editadoAgora ? null : props.aprovada;

  const gravarOrdem = (nova: Parada[]) => {
    setOrdem(nova);
    setOrdemManual(true);
    setEditadoAgora(true);
    iniciar(async () => {
      const r = await salvarOrdemRota(dia, nova.map((p) => p.id));
      if (!r.ok) setErro(r.erro);
    });
  };
  const mover = (id: number, passo: -1 | 1) => {
    const i = ordem.findIndex((p) => p.id === id);
    const j = i + passo;
    if (j < 0 || j >= ordem.length) return;
    const nova = [...ordem];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    gravarOrdem(nova);
  };
  /** Começa a rota por esta entrega e leva junto as outras do mesmo bairro. */
  const comecarPor = (id: number) => {
    const alvo = ordem.find((p) => p.id === id)!;
    const mesmoBairro = (p: Parada) => p.id !== id && normalizar(p.bairro) === normalizar(alvo.bairro) && !!alvo.bairro;
    gravarOrdem([alvo, ...ordem.filter(mesmoBairro), ...ordem.filter((p) => p.id !== id && !mesmoBairro(p))]);
  };
  const ordemSugerida = () =>
    iniciar(async () => {
      const r = await limparOrdemRota(dia, ordem.map((p) => p.id));
      if (!r.ok) return setErro(r.erro);
      setEditadoAgora(true);
      router.refresh();
    });
  const aprovar = () =>
    iniciar(async () => {
      const r = await aprovarRota(dia, ordem.map((p) => p.id));
      if (!r.ok) return setErro(r.erro);
      setEditando(false);
      setEditadoAgora(false);
      router.refresh();
    });
  const status = (id: number, s: Status) =>
    iniciar(async () => {
      const r = await mudarStatus(id, s);
      if (!r.ok) return setErro(r.erro);
      setOrdem((o) => o.map((p) => (p.id === id ? { ...p, status: s } : p)));
      router.refresh();
    });
  const zapSaindo = (p: Parada) => linkWhatsApp(preencher(mensagens.saiu_entrega ?? "", { nome: p.cliente_nome, numero: p.numero }), p.telefone);

  return (
    <>
      {erro && <p className="p-erro">{erro}</p>}

      {/* ---------- PRODUÇÃO ---------- */}
      <h2>🔨 Produzir (na ordem das viagens)</h2>
      {viagens.map((v, n) => (
        <section key={"prod" + n} className="p-card">
          <b>Viagem {n + 1} · {v.reduce((s, p) => s + p.bancos, 0)} banco(s) · {horas(v.reduce((s, p) => s + p.bancos, 0))}</b>
          {v.map((p) => (
            <div key={p.id} className={`p-item st-${p.status}`} style={{ boxShadow: "none" }}>
              <div className="linha">
                <span><b>{p.itens}</b></span>
                <span className={`p-badge ${p.status}`}>{ROTULO[p.status as Status]}</span>
              </div>
              <small>{p.cliente_nome ?? "Cliente"} · #{p.numero}</small>
              <div className="p-botoes">
                {["novo", "confirmado", "reagendado"].includes(p.status) && (
                  <button className="p-btn claro" disabled={pendente} onClick={() => status(p.id, "em_producao")}>▶ Comecei</button>
                )}
                {["novo", "confirmado", "reagendado", "em_producao"].includes(p.status) && (
                  <button className="p-btn laranja" disabled={pendente} onClick={() => status(p.id, "pronto")}>✓ Ficou pronto</button>
                )}
              </div>
            </div>
          ))}
        </section>
      ))}

      {/* ---------- ENTREGAS ---------- */}
      <h2>🚚 Entregas · {viagens.length} viagem(ns) de até {bancosPorViagem} bancos</h2>

      {/* Situação da rota: aprovada, sugerida ou em edição */}
      {aprovada && !editando ? (
        <div className="p-ok">
          ✅ Rota aprovada{aprovada.por ? ` por ${aprovada.por}` : ""} em {hora(aprovada.em)}.
          {podeEditar && (
            <div className="p-botoes" style={{ marginTop: 8 }}>
              <button className="p-btn claro" onClick={() => setEditando(true)}>✏️ Editar rota</button>
            </div>
          )}
        </div>
      ) : editando ? (
        <div className="p-aviso">
          ✏️ Editando: use ↑ ↓ ou “Começar por este bairro”. {ordemManual ? "" : "(ordem ainda é a sugerida)"}
          <div className="p-botoes" style={{ marginTop: 8 }}>
            <button className="p-btn laranja" disabled={pendente} onClick={aprovar}>✅ Aprovar esta rota</button>
            {ordemManual && <button className="p-btn claro" disabled={pendente} onClick={ordemSugerida}>↺ Voltar à sugerida</button>}
          </div>
        </div>
      ) : (
        <div className="p-aviso">
          📝 {props.mudouDepois && !editadoAgora ? "Entrou entrega nova neste dia — confira a rota de novo." : ordemManual ? "Rota editada, ainda não aprovada." : "Rota sugerida (entrega mais perto da anterior, saindo da marcenaria)."}
          {podeEditar ? (
            <div className="p-botoes" style={{ marginTop: 8 }}>
              <button className="p-btn laranja" disabled={pendente} onClick={aprovar}>✅ Aprovar esta rota</button>
              <button className="p-btn claro" onClick={() => setEditando(true)}>✏️ Editar rota</button>
            </div>
          ) : (
            <div><small>Aguardando o patrão aprovar.</small></div>
          )}
        </div>
      )}

      {viagens.map((v, n) => (
        <section key={"via" + n} className="p-card">
          <div className="linha" style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <b>Viagem {n + 1}</b>
            <small>{[...new Set(v.map((p) => p.bairro ?? "—"))].join(", ")}</small>
          </div>
          {!editando && <a className="p-btn" href={linkGoogleMaps(base, v)} target="_blank" rel="noopener">🗺️ Abrir rota no Google Maps</a>}
          {v.map((p) => {
            const pos = ordem.findIndex((x) => x.id === p.id);
            return (
              <div key={p.id} className={`p-item st-${p.status}`} style={{ boxShadow: "none" }}>
                <div className="linha">
                  <b>{pos + 1}. {p.cliente_nome ?? "Cliente"}</b>
                  <span className={`p-badge ${p.status}`}>{ROTULO[p.status as Status]}</span>
                </div>
                <small>{[p.endereco, p.bairro, p.cidade].filter(Boolean).join(", ") || "Sem endereço"}{p.referencia ? ` · ref.: ${p.referencia}` : ""}</small>
                <small>{p.itens}{p.telefone ? ` · ${p.telefone}` : ""}</small>
                {editando ? (
                  <div className="p-botoes">
                    <button className="p-btn claro" aria-label="Subir" disabled={pendente || pos === 0} onClick={() => mover(p.id, -1)}>↑</button>
                    <button className="p-btn claro" aria-label="Descer" disabled={pendente || pos === ordem.length - 1} onClick={() => mover(p.id, 1)}>↓</button>
                    {pos > 0 && <button className="p-btn claro" disabled={pendente} onClick={() => comecarPor(p.id)}>⤒ Começar por {p.bairro ?? "aqui"}</button>}
                  </div>
                ) : (
                  <div className="p-botoes">
                    {p.telefone && p.status !== "entregue" && (
                      <a className="p-btn verde" href={zapSaindo(p)} target="_blank" rel="noopener"
                        onClick={() => iniciar(async () => { await avisoEnviado(p.id, "saiu_entrega", "saiu_entrega"); router.refresh(); })}>
                        💬 {p.avisos.saiu_entrega ? "✓ Avisado" : "Saindo"}
                      </a>
                    )}
                    {p.status !== "entregue" ? (
                      <button className="p-btn laranja" disabled={pendente} onClick={() => confirm(`Marcar #${p.numero} como entregue e pago?`) && status(p.id, "entregue")}>✓ Entregue</button>
                    ) : (
                      <span className="p-badge entregue">Entregue</span>
                    )}
                    <Link className="p-btn claro" href={`/painel/pedidos/${p.id}`}>Ver</Link>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
      {papel === "vendedor" && <small>Só o patrão/marceneiro pode editar e aprovar a rota.</small>}
    </>
  );
}
