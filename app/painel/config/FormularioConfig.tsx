/* Tela de configurações (admin): preços, capacidade, textos, faixa de promoção e Pixel. */
"use client";
import { useState } from "react";
import type { ConfigGeral } from "@/lib/configDb";
import { apagarExemplos, coordenadasDoEndereco, criarExemplos, salvarConfig } from "../actions";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TEXTOS: [string, string][] = [
  ["em_producao", "Seu banco está em produção"],
  ["confirmado", "Confirmação de data"],
  ["pronto", "Seu banco está pronto"],
  ["saiu_entrega", "Saindo para entrega"],
  ["proposta", "Propor outra data"],
];

export default function FormularioConfig({ inicial }: { inicial: ConfigGeral }) {
  const [c, setC] = useState<ConfigGeral>(inicial);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const set = <K extends keyof ConfigGeral>(k: K, v: ConfigGeral[K]) => setC((x) => ({ ...x, [k]: v }));
  const num = (v: string) => (v === "" ? 0 : Number(v));

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const r = await salvarConfig(c);
    setSalvando(false);
    setMsg(r.ok ? { ok: true, texto: "Configurações salvas! O site se atualiza em até 1 minuto." } : { ok: false, texto: r.erro });
  }

  return (
    <form className="p-form" onSubmit={salvar}>
      <section className="p-card p-form">
        <h2>Preços (acabamento natural)</h2>
        {c.medidas.map((m, i) => (
          <div className="p-grid2" key={m.id}>
            <label>{m.medida} — {m.lugares}
              <input type="number" step="0.01" value={m.preco} onChange={(e) => set("medidas", c.medidas.map((x, j) => (j === i ? { ...x, preco: num(e.target.value) } : x)))} />
            </label>
          </div>
        ))}
        <label>Adicional do verniz (R$)<input type="number" step="0.01" value={c.adicionalVerniz} onChange={(e) => set("adicionalVerniz", num(e.target.value))} /></label>
      </section>

      <section className="p-card p-form">
        <h2>Produção e agenda</h2>
        <div className="p-grid2">
          <label>Capacidade (bancos/dia)<input type="number" min={1} value={c.capacidadeDiaria} onChange={(e) => set("capacidadeDiaria", num(e.target.value))} /></label>
          <label>Horas por banco<input type="number" step="0.25" value={c.horasPorBanco} onChange={(e) => set("horasPorBanco", num(e.target.value))} /></label>
          <label>Bancos por viagem<input type="number" min={1} value={c.bancosPorViagem} onChange={(e) => set("bancosPorViagem", num(e.target.value))} /></label>
          <label>Antecedência mínima (dias)<input type="number" min={0} value={c.antecedenciaMinimaDias} onChange={(e) => set("antecedenciaMinimaDias", num(e.target.value))} /></label>
          <label>Mostrar no site até (dias)<input type="number" min={7} value={c.diasParaFrente} onChange={(e) => set("diasParaFrente", num(e.target.value))} /></label>
        </div>
        <b>Dias da semana SEM produção</b>
        <div className="p-botoes">
          {DIAS.map((nome, d) => (
            <label key={d} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="checkbox" style={{ width: 20 }} checked={c.diasSemProducao.includes(d)} onChange={(e) => set("diasSemProducao", e.target.checked ? [...c.diasSemProducao, d] : c.diasSemProducao.filter((x) => x !== d))} />
              {nome}
            </label>
          ))}
        </div>
        <small>Feriados e folgas específicas: bloqueie o dia na tela Agenda.</small>
      </section>

      <section className="p-card p-form">
        <h2>Ponto de saída das entregas (marcenaria)</h2>
        <label>Endereço da marcenaria<input value={c.base.endereco} onChange={(e) => set("base", { ...c.base, endereco: e.target.value })} placeholder="Rua, número, bairro, cidade" /></label>
        <button type="button" className="p-btn claro" onClick={async () => {
          const r = await coordenadasDoEndereco(c.base.endereco);
          if (r.ok) { set("base", { ...c.base, lat: r.lat!, lng: r.lng! }); setMsg({ ok: true, texto: "Localização encontrada! Clique em Salvar." }); }
          else setMsg({ ok: false, texto: r.erro });
        }}>📍 Achar localização pelo endereço</button>
        <small>Localização atual: {c.base.lat.toFixed(4)}, {c.base.lng.toFixed(4)} — usada para sugerir a ordem das entregas.</small>
      </section>

      <section className="p-card p-form">
        <h2>Site</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="checkbox" style={{ width: 20 }} checked={c.promo.ativa} onChange={(e) => set("promo", { ...c.promo, ativa: e.target.checked })} /> Mostrar faixa de promoção no topo
        </label>
        <label>Texto da faixa<input value={c.promo.texto} onChange={(e) => set("promo", { ...c.promo, texto: e.target.value })} /></label>
        <label>ID do Meta Pixel (deixe vazio para desligar)<input value={c.metaPixelId} onChange={(e) => set("metaPixelId", e.target.value.trim())} inputMode="numeric" /></label>
      </section>

      <section className="p-card p-form">
        <h2>Textos de WhatsApp</h2>
        <small>Use {"{nome}"}, {"{numero}"} e {"{data}"} — são trocados automaticamente.</small>
        {TEXTOS.map(([k, nome]) => (
          <label key={k}>{nome}<textarea rows={3} value={c.mensagens[k] ?? ""} onChange={(e) => set("mensagens", { ...c.mensagens, [k]: e.target.value })} /></label>
        ))}
      </section>

      {msg && <p className={msg.ok ? "p-ok" : "p-erro"}>{msg.texto}</p>}
      <button className="p-btn laranja" disabled={salvando}>{salvando ? "Salvando…" : "Salvar configurações"}</button>

      <section className="p-card p-form">
        <h2>Dados de exemplo</h2>
        <small>Cria pedidos de teste nos próximos dias para você experimentar a agenda. Depois é só apagar.</small>
        <div className="p-botoes">
          <button type="button" className="p-btn claro" onClick={async () => { const r = await criarExemplos(); setMsg(r.ok ? { ok: true, texto: `${r.criados} pedidos de exemplo criados.` } : { ok: false, texto: r.erro }); }}>Criar exemplos</button>
          <button type="button" className="p-btn vermelho" onClick={async () => { if (!confirm("Apagar todos os pedidos de exemplo?")) return; const r = await apagarExemplos(); setMsg(r.ok ? { ok: true, texto: "Exemplos apagados." } : { ok: false, texto: r.erro }); }}>Apagar exemplos</button>
        </div>
      </section>
    </form>
  );
}
