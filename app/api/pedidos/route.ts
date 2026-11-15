import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { carregarConfig } from "@/lib/configDb";
import { precoUnitario } from "@/lib/pedido";
import { admin } from "@/lib/supabase/admin";

/**
 * Recebe o pedido feito no site e salva como "Novo, aguardando confirmação".
 * O preço é SEMPRE recalculado aqui no servidor (não confiamos no valor enviado pelo navegador).
 */
export async function POST(req: Request) {
  let c: Record<string, unknown>;
  try {
    c = await req.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido" }, { status: 400 });
  }
  const texto = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);
  const medidaId = texto(c.medidaId, 20);
  const acabId = texto(c.acabId, 20);
  const bairro = texto(c.bairro);
  const quantidade = Math.round(Number(c.quantidade));
  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto(c.data, 10)) ? texto(c.data, 10) : null;

  const cfg = await carregarConfig();
  const unit = precoUnitario(medidaId, acabId, cfg);
  if (!unit || !bairro || !(quantidade >= 1 && quantidade <= 20)) {
    return NextResponse.json({ erro: "Faltam dados do pedido" }, { status: 400 });
  }

  const db = admin();
  // Número provisório e único; depois vira "1000 + id" (sequencial e fácil de falar no WhatsApp)
  const provisorio = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const { data: criado, error } = await db
    .from("pedidos")
    .insert({
      numero: provisorio,
      status: "novo",
      aceite: data ? "pendente" : "pendente",
      bairro,
      cidade: texto(c.cidade),
      itens: [{ medidaId, acabId, quantidade }],
      bancos: quantidade,
      valor_total: unit * quantidade,
      data_desejada: data,
      origem: texto(c.origem, 40) || null,
      canal: "site",
      observacoes: `Pedido feito pelo site (${config.nome}).`,
    })
    .select("id")
    .single();
  if (error || !criado) {
    return NextResponse.json({ erro: "Não foi possível salvar" }, { status: 500 });
  }
  const numero = String(1000 + criado.id);
  await db.from("pedidos").update({ numero }).eq("id", criado.id);
  return NextResponse.json({ numero, salvo: true });
}
