import Link from "next/link";
import { notFound } from "next/navigation";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { dataBR } from "@/lib/datas";
import { descreverItens } from "@/lib/itens";
import { brl } from "@/lib/pedido";
import { ROTULO, type Status } from "@/lib/status";
import { admin } from "@/lib/supabase/admin";
import AcoesPedido from "../AcoesPedido";
import FormularioPedido from "../FormularioPedido";

export default async function Pedido({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ editar?: string }> }) {
  const u = await exigirPagina();
  const { id } = await params;
  const { editar } = await searchParams;
  const db = admin();
  const { data: p } = await db.from("pedidos").select("*").eq("id", Number(id)).maybeSingle();
  if (!p) notFound();
  const cfg = await carregarConfig();

  if (editar && u.papel !== "marceneiro") {
    const [{ data: vend }, { data: bairros }] = await Promise.all([db.from("perfis").select("id,nome").in("papel", ["vendedor", "admin"]), db.from("bairros").select("nome")]);
    return (
      <>
        <h1>Editar pedido #{p.numero}</h1>
        <FormularioPedido
          tabela={{ medidas: cfg.medidas, adicionalVerniz: cfg.adicionalVerniz }}
          vendedores={vend ?? []}
          bairros={[...new Set((bairros ?? []).map((b) => b.nome))]}
          inicial={{
            id: p.id, cliente_nome: p.cliente_nome ?? "", telefone: p.telefone ?? "", endereco: p.endereco ?? "", bairro: p.bairro ?? "", cidade: p.cidade ?? "",
            referencia: p.referencia ?? "", itens: p.itens, valor_total: Number(p.valor_total), taxa_entrega: p.taxa_entrega === null ? null : Number(p.taxa_entrega),
            forma_pagamento: p.forma_pagamento ?? "", data_desejada: p.data_desejada, observacoes: p.observacoes ?? "", vendedor_id: p.vendedor_id,
          }}
        />
      </>
    );
  }

  const { data: vendedor } = p.vendedor_id ? await db.from("perfis").select("nome").eq("id", p.vendedor_id).maybeSingle() : { data: null };
  const total = Number(p.valor_total) + Number(p.taxa_entrega ?? 0);

  return (
    <>
      <div className="p-botoes" style={{ justifyContent: "space-between" }}>
        <Link href="/painel" className="p-btn claro">← Pedidos</Link>
        {u.papel !== "marceneiro" && <Link href={`/painel/pedidos/${p.id}?editar=1`} className="p-btn claro">Editar</Link>}
      </div>
      <h1>Pedido #{p.numero} <span className={`p-badge ${p.status}`}>{ROTULO[p.status as Status]}</span></h1>

      <dl className="p-card p-kv">
        <dt>Cliente</dt><dd>{p.cliente_nome ?? "Cliente do site (ainda sem nome)"}</dd>
        <dt>Telefone</dt><dd>{p.telefone ?? "—"}</dd>
        <dt>Itens</dt><dd>{descreverItens(p.itens)} ({p.bancos} banco{p.bancos > 1 ? "s" : ""})</dd>
        <dt>Endereço</dt><dd>{[p.endereco, p.bairro, p.cidade].filter(Boolean).join(", ") || "—"}{p.referencia ? ` (ref.: ${p.referencia})` : ""}</dd>
        <dt>Valor</dt><dd>{brl(Number(p.valor_total))} + entrega {p.taxa_entrega === null ? "a consultar" : brl(Number(p.taxa_entrega))} {p.taxa_entrega !== null && <b>= {brl(total)}</b>}</dd>
        <dt>Pagamento</dt><dd>{p.forma_pagamento ?? "Na entrega"}</dd>
        <dt>Data desejada</dt><dd>{dataBR(p.data_desejada)}</dd>
        <dt>Agendado</dt><dd>{dataBR(p.data_agendada)}</dd>
        <dt>Origem</dt><dd>{p.canal === "site" ? "Site" : p.canal === "exemplo" ? "Exemplo" : "Cadastro manual"}{p.origem ? ` · ${p.origem}` : ""}</dd>
        <dt>Vendedor</dt><dd>{vendedor?.nome ?? "—"}</dd>
        {p.observacoes && (<><dt>Obs.</dt><dd>{p.observacoes}</dd></>)}
      </dl>

      <AcoesPedido
        id={p.id} numero={p.numero} status={p.status as Status} nome={p.cliente_nome} telefone={p.telefone} bancos={p.bancos}
        dataAgendada={p.data_agendada} dataDesejada={p.data_desejada} papel={u.papel} mensagens={cfg.mensagens}
      />
    </>
  );
}
