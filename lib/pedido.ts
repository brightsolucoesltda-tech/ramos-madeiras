import { config } from "./config";

/** Formata número como moeda brasileira. */
export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Preço unitário = preço da medida + verniz (se houver). */
export function precoUnitario(medidaId: string, acabId: string) {
  const m = config.medidas.find((x) => x.id === medidaId);
  const a = config.acabamentos.find((x) => x.id === acabId);
  if (!m || !a) return 0;
  return m.preco + (a.verniz ? config.adicionalVerniz : 0);
}

/** Link do WhatsApp com mensagem pronta. */
export const linkWhatsApp = (texto: string) =>
  `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`;

export interface DadosPedido {
  numero: string;
  medidaId: string;
  acabId: string;
  quantidade: number;
  bairro: string;
  cidade: string;
  data: string; // AAAA-MM-DD ou ""
  origem: string;
}

const dataBR = (iso: string) => (iso ? iso.split("-").reverse().join("/") : "a combinar");

/** Monta a mensagem de WhatsApp do pedido. */
export function mensagemPedido(d: DadosPedido) {
  const m = config.medidas.find((x) => x.id === d.medidaId)!;
  const a = config.acabamentos.find((x) => x.id === d.acabId)!;
  const total = precoUnitario(d.medidaId, d.acabId) * d.quantidade;
  return [
    `Olá, ${config.nome}! Fiz meu pedido pelo site (nº ${d.numero}):`,
    `• Banco-mesa ${m.id} (${m.lugares})`,
    `• Acabamento: ${a.nome}`,
    `• Quantidade: ${d.quantidade}`,
    `• Total: ${brl(total)} + entrega`,
    `• Bairro: ${d.bairro}${d.cidade ? " - " + d.cidade : ""}`,
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
