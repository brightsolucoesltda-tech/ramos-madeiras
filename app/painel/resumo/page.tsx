/* RESUMO SIMPLES: pedidos da semana, bancos x capacidade, total vendido e vendas por vendedor. */
import Link from "next/link";
import { agendaDoPeriodo } from "@/lib/agenda";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { dataBR, hojeBR, inicioSemana, somarDias } from "@/lib/datas";
import { brl } from "@/lib/pedido";
import { admin } from "@/lib/supabase/admin";

export default async function Resumo({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await exigirPagina();
  const { p } = await searchParams;
  const hoje = hojeBR();
  const mes = p === "mes";
  const inicio = mes ? hoje.slice(0, 8) + "01" : inicioSemana(hoje);
  const fim = mes ? somarDias(hoje.slice(0, 8) + "01", 31).slice(0, 8) + "01" : somarDias(inicioSemana(hoje), 7);

  const cfg = await carregarConfig();
  const db = admin();
  // Pedidos criados no período (menos cancelados)
  const { data: pedidos } = await db.from("pedidos").select("valor_total,bancos,status,vendedor_id,canal").gte("criado_em", inicio).lt("criado_em", fim).neq("status", "cancelado");
  const { data: vend } = await db.from("perfis").select("id,nome");
  const dias = await agendaDoPeriodo(cfg, inicio, somarDias(fim, -1));
  const bancosAgendados = dias.reduce((s, d) => s + d.usados, 0);
  const capacidade = dias.filter((d) => !d.bloqueado && !d.semProducao).length * cfg.capacidadeDiaria;

  const lista = pedidos ?? [];
  const vendido = lista.reduce((s, x) => s + Number(x.valor_total), 0);
  const recebido = lista.filter((x) => x.status === "entregue").reduce((s, x) => s + Number(x.valor_total), 0);
  const porVend = new Map<string, { qtd: number; valor: number }>();
  for (const x of lista) {
    const nome = x.vendedor_id ? (vend ?? []).find((v) => v.id === x.vendedor_id)?.nome ?? "—" : x.canal === "site" ? "Site (sem vendedor)" : "—";
    const a = porVend.get(nome) ?? { qtd: 0, valor: 0 };
    porVend.set(nome, { qtd: a.qtd + 1, valor: a.valor + Number(x.valor_total) });
  }

  return (
    <>
      <h1>Resumo</h1>
      <div className="p-botoes">
        <Link className={`p-btn ${mes ? "claro" : "laranja"}`} href="/painel/resumo">Esta semana</Link>
        <Link className={`p-btn ${mes ? "laranja" : "claro"}`} href="/painel/resumo?p=mes">Este mês</Link>
      </div>
      <small>Período: {dataBR(inicio)} a {dataBR(somarDias(fim, -1))}</small>
      <div className="p-kpis">
        <div className="p-kpi"><b>{lista.length}</b>pedidos</div>
        <div className="p-kpi"><b>{bancosAgendados}/{capacidade}</b>bancos agendados x capacidade</div>
        <div className="p-kpi"><b>{brl(vendido)}</b>total vendido</div>
        <div className="p-kpi"><b>{brl(recebido)}</b>já entregue (pago)</div>
      </div>
      <h2>Vendas por vendedor</h2>
      <table className="p-tabela">
        <thead><tr><th>Vendedor</th><th>Pedidos</th><th>Valor</th></tr></thead>
        <tbody>
          {[...porVend.entries()].map(([nome, a]) => <tr key={nome}><td>{nome}</td><td>{a.qtd}</td><td>{brl(a.valor)}</td></tr>)}
          {porVend.size === 0 && <tr><td colSpan={3}>Sem vendas no período.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
