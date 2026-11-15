/* Formulário de pedido (cadastro manual e edição). Simples e grande, para usar no celular. */
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { config } from "@/lib/config";
import { brl, precoUnitario, type TabelaPreco } from "@/lib/pedido";
import { salvarPedido, type ItemPedido, type PedidoForm } from "../actions";

export default function FormularioPedido({ inicial, tabela, vendedores, bairros }: { inicial: PedidoForm; tabela: TabelaPreco; vendedores: { id: string; nome: string }[]; bairros: string[] }) {
  const [f, setF] = useState<PedidoForm>(inicial);
  const [valorManual, setValorManual] = useState(!!inicial.id); // na edição, não recalcula sozinho
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();

  const totalCalculado = useMemo(() => f.itens.reduce((s, i) => s + precoUnitario(i.medidaId, i.acabId, tabela) * i.quantidade, 0), [f.itens, tabela]);
  const valor = valorManual ? f.valor_total : totalCalculado;
  const set = <K extends keyof PedidoForm>(k: K, v: PedidoForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const setItem = (n: number, parte: Partial<ItemPedido>) => set("itens", f.itens.map((it, i) => (i === n ? { ...it, ...parte } : it)));

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);
    const r = await salvarPedido({ ...f, valor_total: valor });
    setSalvando(false);
    if (!r.ok) return setErro(r.erro);
    router.push(`/painel/pedidos/${r.id}`);
    router.refresh();
  }

  return (
    <form className="p-card p-form" onSubmit={enviar}>
      <label>Nome do cliente *<input value={f.cliente_nome} onChange={(e) => set("cliente_nome", e.target.value)} required /></label>
      <label>Telefone (WhatsApp)<input type="tel" inputMode="tel" value={f.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="(41) 99999-9999" /></label>
      <label>Endereço<input value={f.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua, número" /></label>
      <div className="p-grid2">
        <label>Bairro<input list="lista-bairros" value={f.bairro} onChange={(e) => set("bairro", e.target.value)} /></label>
        <label>Cidade<input value={f.cidade} onChange={(e) => set("cidade", e.target.value)} /></label>
      </div>
      <datalist id="lista-bairros">{bairros.map((b) => <option key={b} value={b} />)}</datalist>
      <label>Ponto de referência<input value={f.referencia} onChange={(e) => set("referencia", e.target.value)} /></label>

      <h2>Itens</h2>
      {f.itens.map((it, n) => (
        <div className="p-linha-item" key={n}>
          <label>Medida
            <select value={it.medidaId} onChange={(e) => setItem(n, { medidaId: e.target.value })}>
              {tabela.medidas.map((m) => <option key={m.id} value={m.id}>{m.medida} ({brl(m.preco)})</option>)}
            </select>
          </label>
          <label>Acabamento
            <select value={it.acabId} onChange={(e) => setItem(n, { acabId: e.target.value })}>
              {config.acabamentos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </label>
          <label>Qtd<input type="number" min={1} max={20} value={it.quantidade} onChange={(e) => setItem(n, { quantidade: Math.max(1, Number(e.target.value) || 1) })} /></label>
          <button type="button" className="p-btn claro" aria-label="Remover item" onClick={() => set("itens", f.itens.filter((_, i) => i !== n))} disabled={f.itens.length === 1}>×</button>
        </div>
      ))}
      <button type="button" className="p-btn claro" onClick={() => set("itens", [...f.itens, { medidaId: tabela.medidas[0].id, acabId: "natural", quantidade: 1 }])}>+ Adicionar item</button>

      <div className="p-grid2">
        <label>Valor dos itens (R$)<input type="number" step="0.01" value={valor} onChange={(e) => { setValorManual(true); set("valor_total", Number(e.target.value)); }} /></label>
        <label>Taxa de entrega (R$)<input type="number" step="0.01" value={f.taxa_entrega ?? ""} onChange={(e) => set("taxa_entrega", e.target.value === "" ? null : Number(e.target.value))} placeholder="a consultar" /></label>
      </div>
      {valorManual && <button type="button" className="p-btn claro" onClick={() => setValorManual(false)}>Recalcular pela tabela ({brl(totalCalculado)})</button>}
      <div className="p-grid2">
        <label>Forma de pagamento
          <select value={f.forma_pagamento} onChange={(e) => set("forma_pagamento", e.target.value)}>
            <option value="">Escolher…</option>
            {["Pix na entrega", "Dinheiro na entrega", "Cartão de débito", "Cartão de crédito (até 10x)"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label>Data desejada<input type="date" value={f.data_desejada ?? ""} onChange={(e) => set("data_desejada", e.target.value || null)} /></label>
      </div>
      <label>Vendedor responsável
        <select value={f.vendedor_id ?? ""} onChange={(e) => set("vendedor_id", e.target.value || null)}>
          <option value="">Eu mesmo</option>
          {vendedores.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
        </select>
      </label>
      <label>Observações<textarea rows={3} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} /></label>

      {erro && <p className="p-erro">{erro}</p>}
      <button className="p-btn laranja" disabled={salvando}>{salvando ? "Salvando…" : f.id ? "Salvar alterações" : "Cadastrar pedido"}</button>
    </form>
  );
}
