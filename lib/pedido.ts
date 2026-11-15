import { config, type Medida } from "./config";

/** Formata número como moeda brasileira. */
export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Parte da config que o cálculo de preço precisa (vem do banco, com padrão em lib/config.ts). */
export interface TabelaPreco {
  medidas: Medida[];
  adicionalVerniz: number;
}

export const tabelaPadrao: TabelaPreco = {
  medidas: config.medidas as unknown as Medida[],
  adicionalVerniz: config.adicionalVerniz,
};

/** Preço unitário = preço da medida + verniz (se o acabamento for envernizado). */
export function precoUnitario(medidaId: string, acabId: string, t: TabelaPreco = tabelaPadrao) {
  const m = t.medidas.find((x) => x.id === medidaId);
  const a = config.acabamentos.find((x) => x.id === acabId);
  if (!m || !a) return 0;
  return m.preco + (a.verniz ? t.adicionalVerniz : 0);
}

/** Link do WhatsApp com mensagem pronta. Se `telefone` vier, abre a conversa com o cliente. */
export function linkWhatsApp(texto: string, telefone?: string | null) {
  let numero = config.whatsapp;
  if (telefone) {
    const d = telefone.replace(/\D/g, "");
    numero = d.length <= 11 ? "55" + d : d;
  }
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export interface DadosPedido {
  numero: string;
  medidaId: string;
  acabId: string;
  quantidade: number;
  bairro: string;
  cidade: string;
  data: string; // AAAA-MM-DD ou ""
  origem: string;
  nome?: string;
  endereco?: string;
}

const dataBR = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "a combinar");

/** Monta a mensagem de WhatsApp do pedido feito no site. */
export function mensagemPedido(d: DadosPedido, t: TabelaPreco = tabelaPadrao) {
  const m = t.medidas.find((x) => x.id === d.medidaId)!;
  const a = config.acabamentos.find((x) => x.id === d.acabId)!;
  const total = precoUnitario(d.medidaId, d.acabId, t) * d.quantidade;
  return [
    `Olá, ${config.nome}!${d.nome?.trim() ? ` Sou ${d.nome.trim()} e` : ""} fiz meu pedido pelo site (nº ${d.numero}):`.replace("! fiz", "! Fiz"),
    `• Banco-mesa ${m.id} (${m.lugares})`,
    `• Acabamento: ${a.nome}`,
    `• Quantidade: ${d.quantidade}`,
    `• Total: ${brl(total)} + entrega`,
    `• Endereço: ${d.endereco ? d.endereco + " - " : ""}${d.bairro}${d.cidade ? " - " + d.cidade : ""}`,
    `• Data desejada: ${dataBR(d.data)}`,
    `Podem confirmar? [origem: ${d.origem || "direto"}]`,
  ].join("\n");
}

/** Dispara evento do Meta Pixel, se estiver carregado. */
export function rastrear(evento: "Contact" | "Lead", dados?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq;
  if (fbq) fbq("track", evento, dados);
}
