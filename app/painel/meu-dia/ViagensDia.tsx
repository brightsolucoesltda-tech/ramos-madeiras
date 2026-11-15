/* Produção e viagens do dia: reordenar entregas (↑ ↓), abrir rota no Google Maps, avisar e marcar entregue. */
"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Papel } from "@/lib/auth";
import { linkWhatsApp } from "@/lib/pedido";
import { dividirViagens, linkGoogleMaps, type Parada } from "@/lib/rotas";
import { preencher, ROTULO, type Status } from "@/lib/status";
import { avisoEnviado, limparOrdemRota, mudarStatus, salvarOrdemRota } from "../actions";

interface Props {
  paradasIniciais: Parada[];
  manual: boolean;
  bancosPorViagem: number;
  horasPorBanco: number;
  base: { endereco: string; lat: number; lng: number };
  mensagens: Record<string, string>;
  papel: Papel;
}

export default function ViagensDia({ paradasIniciais, manual, bancosPorViagem, horasPorBanco, base, mensagens, papel }: Props) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [ordem, setOrdem] = useState(paradasIniciais);
  const [ordemManual, setOrdemManual] = useState(manual);
  const [erro, setErro] = useState("");
  const viagens = useMemo(() => dividirViagens(ordem, bancosPorViagem), [ordem, bancosPorViagem]);
  const horas = (b: number) => `${(b * horasPorBanco).toString().replace(".", ",")}h`;

  const mover = (id: number, passo: -1 | 1) => {
    const i = ordem.findIndex((p) => p.id === id);
    const j = i + passo;
    if (j < 0 || j >= ordem.length) return;
    const nova = [...ordem];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setOrdem(nova);
    setOrdemManual(true);
    iniciar(async () => {
      const r = await salvarOrdemRota(nova.map((p) => p.id));
      if (!r.ok) setErro(r.erro);
    });
  };
  const ordemSugerida = () =>
    iniciar(async () => {
      const r = await limparOrdemRota(ordem.map((p) => p.id));
      if (!r.ok) return setErro(r.erro);
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
      <div className="p-botoes" style={{ justifyContent: "space-between" }}>
        <h2>🚚 Entregas · {viagens.length} viagem(ns) de até {bancosPorViagem} bancos</h2>
        {ordemManual && <button className="p-btn claro" disabled={pendente} onClick={ordemSugerida}>↺ Ordem sugerida</button>}
      </div>
      <small>{ordemManual ? "Ordem arrumada na mão." : "Ordem sugerida: sempre a entrega mais perto da anterior, saindo da marcenaria."} Use ↑ ↓ para trocar.</small>

      {viagens.map((v, n) => (
        <section key={"via" + n} className="p-card">
          <div className="linha" style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
            <b>Viagem {n + 1}</b>
            <small>{[...new Set(v.map((p) => p.bairro ?? "—"))].join(", ")}</small>
          </div>
          <a className="p-btn" href={linkGoogleMaps(base, v)} target="_blank" rel="noopener">🗺️ Abrir rota no Google Maps</a>
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
                <div className="p-botoes">
                  <button className="p-btn claro" aria-label="Subir" disabled={pendente || pos === 0} onClick={() => mover(p.id, -1)}>↑</button>
                  <button className="p-btn claro" aria-label="Descer" disabled={pendente || pos === ordem.length - 1} onClick={() => mover(p.id, 1)}>↓</button>
                  {p.telefone && p.status !== "entregue" && (
                    <a className="p-btn verde" href={zapSaindo(p)} target="_blank" rel="noopener"
                      onClick={() => iniciar(async () => { await avisoEnviado(p.id, "saiu_entrega", papel === "vendedor" ? undefined : "saiu_entrega"); router.refresh(); })}>
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
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}
