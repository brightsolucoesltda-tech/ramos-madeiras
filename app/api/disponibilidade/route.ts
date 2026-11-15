import { NextResponse } from "next/server";
import { datasDisponiveis } from "@/lib/agenda";
import { carregarConfig } from "@/lib/configDb";

/** Datas com vaga na agenda real (capacidade diária, folgas e feriados). */
export async function GET() {
  try {
    const cfg = await carregarConfig();
    return NextResponse.json({ datas: await datasDisponiveis(cfg) });
  } catch {
    // Se o banco estiver fora do ar, o cliente combina a data pelo WhatsApp.
    return NextResponse.json({ datas: [] });
  }
}
