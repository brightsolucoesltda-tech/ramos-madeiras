import { config } from "./config";
import type { ItemPedido } from "@/app/painel/actions";

/** "1x 160x135 Envernizado Mogno, 2x 120x135 Natural" */
export function descreverItens(itens: ItemPedido[] | null | undefined) {
  return (itens ?? [])
    .map((i) => `${i.quantidade}x ${i.medidaId} ${config.acabamentos.find((a) => a.id === i.acabId)?.nome ?? i.acabId}`)
    .join(", ");
}
