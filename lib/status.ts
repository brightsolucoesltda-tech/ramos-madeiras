/* Status dos pedidos: nomes em português, cores e textos de WhatsApp. */
export const STATUS = ["novo", "confirmado", "em_producao", "pronto", "saiu_entrega", "entregue", "reagendado", "cancelado"] as const;
export type Status = (typeof STATUS)[number];

export const ROTULO: Record<Status, string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  em_producao: "Em produção",
  pronto: "Pronto",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue (pago)",
  reagendado: "Reagendado",
  cancelado: "Cancelado",
};

/** Sequência normal do pedido (o botão "avançar" segue esta ordem). */
export const FLUXO: Status[] = ["novo", "confirmado", "em_producao", "pronto", "saiu_entrega", "entregue"];

/** Status que o marceneiro pode marcar (andamento da produção/entrega). */
export const STATUS_MARCENEIRO: Status[] = ["em_producao", "pronto", "saiu_entrega", "entregue"];

export const proximoStatus = (s: Status): Status | null => {
  const i = FLUXO.indexOf(s);
  return i >= 0 && i < FLUXO.length - 1 ? FLUXO[i + 1] : null;
};

/** Preenche {nome}, {numero}, {data} nos textos de WhatsApp. */
export function preencher(modelo: string, v: { nome?: string | null; numero: string; data?: string | null }) {
  const data = v.data ? v.data.split("-").reverse().join("/") : "a combinar";
  return modelo.replaceAll("{nome}", (v.nome ?? "").split(" ")[0] || "tudo bem").replaceAll("{numero}", v.numero).replaceAll("{data}", data);
}
