/* CONFIGURADOR DE PEDIDO — o coração do site. */
"use client";
import { useEffect, useMemo, useState } from "react";
import { config } from "@/lib/config";
import { buscarCep, mascaraCep } from "@/lib/cep";
import { brl, precoUnitario, mensagemPedido, linkWhatsApp, rastrear, type TabelaPreco } from "@/lib/pedido";

/** Formata o WhatsApp enquanto digita: (41) 99999-9999 */
function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const dataLonga = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
};

export default function Configurador({ tabela }: { tabela: TabelaPreco }) {
  const [medidaId, setMedidaId] = useState(tabela.medidas[Math.min(2, tabela.medidas.length - 1)].id);
  const [acabId, setAcabId] = useState("natural");
  const [qtd, setQtd] = useState(1);
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numeroCasa, setNumeroCasa] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cepStatus, setCepStatus] = useState<"" | "buscando" | "ok" | "nao-achou">("");
  const [data, setData] = useState("");
  const [datas, setDatas] = useState<string[] | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Busca as datas com vaga na agenda
  useEffect(() => {
    fetch("/api/disponibilidade").then((r) => r.json()).then((j) => setDatas(j.datas)).catch(() => setDatas([]));
  }, []);

  const total = useMemo(() => precoUnitario(medidaId, acabId, tabela) * qtd, [medidaId, acabId, qtd, tabela]);

  // Ao completar os 8 números do CEP, preenche rua, bairro e cidade sozinho
  async function mudarCep(valor: string) {
    const v = mascaraCep(valor);
    setCep(v);
    if (v.replace(/\D/g, "").length !== 8) return setCepStatus("");
    setCepStatus("buscando");
    const e = await buscarCep(v);
    if (!e) return setCepStatus("nao-achou");
    if (e.rua) setRua(e.rua);
    if (e.bairro) setBairro(e.bairro);
    if (e.cidade) setCidade(`${e.cidade}${e.uf ? " - " + e.uf : ""}`);
    setCepStatus("ok");
  }

  // Origem do cliente pelos parâmetros UTM (guardada na sessão para não perder ao navegar)
  function lerOrigem() {
    const p = new URLSearchParams(window.location.search);
    const o = p.get("utm_source") || p.get("utm_medium");
    try {
      if (o) sessionStorage.setItem("origem", o);
      return sessionStorage.getItem("origem") || "";
    } catch {
      return o || "";
    }
  }

  async function enviar() {
    setErro("");
    const digitos = whats.replace(/\D/g, "");
    if (digitos.length < 10) {
      setErro("Informe o seu WhatsApp com DDD para a gente confirmar o pedido.");
      return;
    }
    if (!rua.trim() || !numeroCasa.trim()) {
      setErro("Informe a rua e o número do endereço de entrega.");
      return;
    }
    if (!bairro.trim()) {
      setErro("Informe o seu bairro para estimarmos a entrega.");
      return;
    }
    const endereco = `${rua.trim()}, ${numeroCasa.trim()}`;
    setEnviando(true);
    const origem = lerOrigem();
    let numero = "----";
    try {
      const r = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medidaId, acabId, quantidade: qtd, nome, telefone: digitos, endereco, cep, bairro, cidade, data, origem, total }),
      });
      const j = await r.json();
      if (r.ok) numero = j.numero;
    } catch {
      /* se falhar, ainda abrimos o WhatsApp para não perder a venda */
    }
    rastrear("Lead", { value: total, currency: "BRL" });
    const msg = mensagemPedido({ numero, medidaId, acabId, quantidade: qtd, endereco, bairro, cidade, data, origem, nome }, tabela);
    // Abre o WhatsApp na mesma aba: no celular vai direto para o app e não é bloqueado como pop-up.
    window.location.href = linkWhatsApp(msg);
    setEnviando(false);
  }

  return (
    <section id="pedido" className="secao secao-escura">
      <div className="container">
        <h2 className="h2">Monte o seu pedido</h2>
        <p className="sub">
          Escolha, envie e a gente confirma pelo WhatsApp. <strong>Você só paga depois de receber.</strong>
        </p>

        <div className="cfg">
          <fieldset>
            <legend>1. Medida</legend>
            <div className="cards">
              {tabela.medidas.map((m) => (
                <button key={m.id} type="button" className={`card-opc ${medidaId === m.id ? "ativo" : ""}`} onClick={() => setMedidaId(m.id)} aria-pressed={medidaId === m.id}>
                  <b>{m.medida}</b>
                  <span>{m.lugares}</span>
                  <em>{brl(m.preco)}</em>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>2. Acabamento</legend>
            <div className="cards">
              {config.acabamentos.map((a) => (
                <button key={a.id} type="button" className={`card-opc ${acabId === a.id ? "ativo" : ""}`} onClick={() => setAcabId(a.id)} aria-pressed={acabId === a.id}>
                  <i className="amostra" style={{ background: a.cor }} />
                  <b>{a.nome}</b>
                  <span>{a.descricao}</span>
                  <em>{a.verniz ? `+ ${brl(tabela.adicionalVerniz)}` : "Incluso"}</em>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>3. Quantidade</legend>
            <div className="qtd">
              <button type="button" onClick={() => setQtd(Math.max(1, qtd - 1))} aria-label="Diminuir">−</button>
              <output>{qtd}</output>
              <button type="button" onClick={() => setQtd(Math.min(20, qtd + 1))} aria-label="Aumentar">+</button>
            </div>
          </fieldset>

          <fieldset>
            <legend>4. Seus dados e onde entregar</legend>
            <div className="campos">
              <label>Seu nome<input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como podemos te chamar?" autoComplete="name" /></label>
              <label>Seu WhatsApp (com DDD) *<input value={whats} onChange={(e) => setWhats(mascaraTelefone(e.target.value))} placeholder="(41) 99999-9999" type="tel" inputMode="numeric" autoComplete="tel-national" required /></label>
              <label>
                CEP (preenche o endereço sozinho)
                <input value={cep} onChange={(e) => mudarCep(e.target.value)} placeholder="00000-000" inputMode="numeric" autoComplete="postal-code" />
                {cepStatus === "buscando" && <small className="nota">Buscando endereço…</small>}
                {cepStatus === "nao-achou" && <small className="nota">CEP não encontrado — preencha o endereço abaixo.</small>}
                {cepStatus === "ok" && <small className="nota">✓ Endereço encontrado. Confira e coloque o número.</small>}
              </label>
              <label>Rua *<input value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Nome da rua" autoComplete="address-line1" /></label>
              <label>Número *<input value={numeroCasa} onChange={(e) => setNumeroCasa(e.target.value)} placeholder="Ex.: 124" inputMode="text" autoComplete="address-line2" /></label>
              <label>Bairro *<input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Seu bairro" autoComplete="address-level3" /></label>
              <label>Cidade<input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua cidade" autoComplete="address-level2" /></label>
            </div>
          </fieldset>

          <fieldset>
            <legend>5. Data de entrega desejada</legend>
            <p className="nota">É uma <strong>preferência</strong>. A confirmação da data vem pelo WhatsApp.</p>
            {datas === null ? (
              <p className="nota">Carregando datas…</p>
            ) : datas.length === 0 ? (
              <p className="nota">Combinamos a data no WhatsApp.</p>
            ) : (
              <div className="datas">
                {datas.slice(0, 12).map((d) => (
                  <button key={d} type="button" className={`data ${data === d ? "ativo" : ""}`} onClick={() => setData(data === d ? "" : d)} aria-pressed={data === d}>
                    {dataLonga(d)}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <div className="total">
            <div>
              <small>Total</small>
              <strong>{brl(total)}</strong>
              <small>+ taxa de entrega a consultar</small>
            </div>
            <span className="selo">Pagamento após a entrega</span>
          </div>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button type="button" className="btn btn-whats btn-grande" onClick={enviar} disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar pedido pelo WhatsApp"}
          </button>
        </div>
      </div>
    </section>
  );
}
