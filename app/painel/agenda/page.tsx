/* AGENDA: visão diária e semanal com barra de ocupação (verde/amarelo/vermelho). */
import Link from "next/link";
import { agendaDoPeriodo, corOcupacao } from "@/lib/agenda";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { dataCurta, hojeBR, inicioSemana, somarDias } from "@/lib/datas";
import { descreverItens } from "@/lib/itens";
import { ROTULO, type Status } from "@/lib/status";
import { admin } from "@/lib/supabase/admin";
import BloqueioDia from "./BloqueioDia";

export default async function Agenda({ searchParams }: { searchParams: Promise<{ dia?: string; visao?: string }> }) {
  const u = await exigirPagina();
  const q = await searchParams;
  const visao = q.visao === "dia" ? "dia" : "semana";
  const base = q.dia && /^\d{4}-\d{2}-\d{2}$/.test(q.dia) ? q.dia : hojeBR();
  const inicio = visao === "semana" ? inicioSemana(base) : base;
  const fim = visao === "semana" ? somarDias(inicio, 6) : base;
  const passo = visao === "semana" ? 7 : 1;

  const cfg = await carregarConfig();
  const dias = await agendaDoPeriodo(cfg, inicio, fim);
  const { data: pedidos } = await admin()
    .from("pedidos")
    .select("id,numero,status,cliente_nome,bairro,itens,bancos,data_agendada,data_desejada")
    .neq("status", "cancelado")
    .or(`and(data_agendada.gte.${inicio},data_agendada.lte.${fim}),and(data_agendada.is.null,data_desejada.gte.${inicio},data_desejada.lte.${fim})`);

  const link = (dia: string, v = visao) => `/painel/agenda?visao=${v}&dia=${dia}`;
  const horas = (b: number) => `${(b * cfg.horasPorBanco).toString().replace(".", ",")}h`;

  return (
    <>
      <h1>Agenda</h1>
      <div className="p-nav-dias">
        <Link className="p-btn claro" href={link(somarDias(base, -passo))}>←</Link>
        <div className="p-botoes">
          <Link className={`p-btn ${visao === "dia" ? "laranja" : "claro"}`} href={link(base, "dia")}>Dia</Link>
          <Link className={`p-btn ${visao === "semana" ? "laranja" : "claro"}`} href={link(base, "semana")}>Semana</Link>
          <Link className="p-btn claro" href={link(hojeBR())}>Hoje</Link>
        </div>
        <Link className="p-btn claro" href={link(somarDias(base, passo))}>→</Link>
      </div>
      <p>Capacidade: <b>{cfg.capacidadeDiaria} bancos/dia</b> · cada banco = {horas(1)} de produção</p>

      <div className={visao === "semana" ? "p-semana" : ""}>
        {dias.map((d) => {
          const doDia = (pedidos ?? []).filter((p) => (p.data_agendada ?? p.data_desejada) === d.data);
          const cor = corOcupacao(d);
          return (
            <section key={d.data} className={`p-card p-dia ${d.bloqueado || d.semProducao ? "bloq" : ""}`}>
              <div className="linha" style={{ display: "flex", justifyContent: "space-between" }}>
                <b>{dataCurta(d.data)}{d.data === hojeBR() ? " · hoje" : ""}</b>
                <span>{d.usados}/{d.capacidade} bancos · {horas(d.usados)}</span>
              </div>
              <div className="p-barra" aria-label={`${d.usados} de ${d.capacidade} bancos`}>
                <i className={cor} style={{ width: `${Math.min(100, (d.usados / d.capacidade) * 100)}%` }} />
              </div>
              {d.usados > d.capacidade && <p className="p-aviso">Acima da capacidade (encaixe / hora extra): +{d.usados - d.capacidade}</p>}
              {d.bloqueado && <p className="p-aviso">🚫 Bloqueado{d.motivo ? `: ${d.motivo}` : ""}</p>}
              {d.semProducao && !d.bloqueado && <small>Sem produção neste dia da semana</small>}
              {doDia.map((p) => (
                <Link key={p.id} href={`/painel/pedidos/${p.id}`} className="p-item" style={{ padding: 8 }}>
                  <div className="linha">
                    <b>#{p.numero} {p.cliente_nome ?? "Cliente do site"}</b>
                    <span className={`p-badge ${p.status}`}>{ROTULO[p.status as Status]}</span>
                  </div>
                  <small>{descreverItens(p.itens)} · {p.bairro ?? "—"}{p.data_agendada ? "" : " · (data desejada, não confirmada)"}</small>
                </Link>
              ))}
              {u.papel !== "vendedor" && <BloqueioDia data={d.data} bloqueado={d.bloqueado} />}
            </section>
          );
        })}
      </div>
    </>
  );
}
