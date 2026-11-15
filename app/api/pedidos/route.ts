import { NextResponse } from "next/server";

/**
 * Recebe o pedido do site e devolve o número.
 * FASE 1: só valida e gera o número (o salvamento no banco entra na Fase 2, com o Supabase).
 * FASE 2: grava na tabela "pedidos" com status "novo".
 */
export async function POST(req: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });
  }
  if (!corpo.medidaId || !corpo.acabId || !corpo.bairro) {
    return NextResponse.json({ erro: "Faltam dados do pedido" }, { status: 400 });
  }
  // Número curto e legível (4 a 5 dígitos), baseado na hora.
  const numero = String(Math.floor(Date.now() / 1000) % 100000).padStart(4, "0");
  // TODO Fase 2: salvar no Supabase aqui.
  return NextResponse.json({ numero, salvo: false });
}
