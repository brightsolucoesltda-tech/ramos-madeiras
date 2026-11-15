/* LISTA DE PEDIDOS com filtros por status, data, vendedor e bairro. */
import Link from "next/link";
import { exigirPagina } from "@/lib/auth";
import { brl } from "@/lib/pedido";
import { dataBR } from "@/lib/datas";
import { descreverItens } from "@/lib/itens";
import { ROTULO, STATUS, type Status } from "@/lib/status";
import { admin } from "@/lib/supabase/admin";

type Filtros = { status?: string; de?: string; ate?: string; vendedor?: string; bairro?: string };

export default async function Pedidos({ searchParams }: { searchParams: Promise<Filtros> }) {
  const u = await exigirPagina();
  const f = await searchParams;
  const db = admin();

  let q = db.from("pedidos").select("*").order("data_agendada", { ascending: true, nullsFirst: true }).order("criado_em", { ascending: false }).limit(200);
  if (f.status) q = q.eq("status", f.status);
  else q = q.not("status", "in", "(entregue,cancelado)"); // por padrão esconde o que já terminou
  if (f.de) q = q.gte("data_agendada", f.de);
  if (f.ate) q = q.lte("data_agendada", f.ate);
  if (f.vendedor) q = q.eq("vendedor_id", f.vendedor);
  if (f.bairro) q = q.ilike("bairro", `%${f.bairro}%`);

  const [{ data: pedidos }, { data: vendedores }] = await Promise.all([q, db.from("perfis").select("id,nome").in("papel", ["vendedor", "admin"])]);
  const nomeVend = new Map((vendedores ?? []).map((v) => [v.id, v.nome]));
  const aguardando = (pedidos ?? []).filter((p) => p.status === "novo").length;

  return (
    <>
      <h1>Pedidos</h1>
      {aguardando > 0 && !f.status && <p className="p-aviso">🔔 {aguardando} pedido(s) novo(s) aguardando confirmação</p>}

      <details className="p-card p-filtros">
        <summary>Filtrar</summary>
        <form className="p-form" method="get">
          <label>Status
            <select name="status" defaultValue={f.status ?? ""}>
              <option value="">Em andamento</option>
              {STATUS.map((s) => <option key={s} value={s}>{ROTULO[s]}</option>)}
            </select>
          </label>
          <div className="p-grid2">
            <label>Data de<input type="date" name="de" defaultValue={f.de} /></label>
            <label>até<input type="date" name="ate" defaultValue={f.ate} /></label>
          </div>
          <div className="p-grid2">
            <label>Vendedor
              <select name="vendedor" defaultValue={f.vendedor ?? ""}>
                <option value="">Todos</option>
                {(vendedores ?? []).map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
              </select>
            </label>
            <label>Bairro<input name="bairro" defaultValue={f.bairro} placeholder="Digite o bairro" /></label>
          </div>
          <div className="p-botoes">
            <button className="p-btn laranja">Aplicar</button>
            <Link className="p-btn claro" href="/painel">Limpar</Link>
          </div>
        </form>
      </details>

      <div className="p-lista">
        {(pedidos ?? []).length === 0 && <p className="p-card">Nenhum pedido encontrado.</p>}
        {(pedidos ?? []).map((p) => (
          <Link key={p.id} href={`/painel/pedidos/${p.id}`} className="p-item">
            <div className="linha">
              <b>#{p.numero} · {p.cliente_nome ?? "Cliente do site"}</b>
              <span className={`p-badge ${p.status}`}>{ROTULO[p.status as Status]}</span>
            </div>
            <span>{descreverItens(p.itens)}</span>
            <small>
              {p.bairro ?? "—"}{p.cidade ? ` · ${p.cidade}` : ""} · {brl(Number(p.valor_total))}
              {p.data_agendada ? ` · agendado ${dataBR(p.data_agendada)}` : p.data_desejada ? ` · desejado ${dataBR(p.data_desejada)}` : " · sem data"}
            </small>
            <small>{p.canal === "site" ? "🌐 Site" : p.canal === "exemplo" ? "🧪 Exemplo" : `🧑 ${nomeVend.get(p.vendedor_id) ?? "Manual"}`}{p.origem ? ` · ${p.origem}` : ""}</small>
          </Link>
        ))}
      </div>

      {u.papel !== "marceneiro" && <Link href="/painel/pedidos/novo" className="p-btn laranja p-fab">+ Novo pedido</Link>}
    </>
  );
}
