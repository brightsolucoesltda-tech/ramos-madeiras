import { NextResponse } from "next/server";
import { config } from "@/lib/config";

/**
 * Datas com vaga para o configurador.
 * FASE 1: gera as datas a partir da config (sem domingos etc.).
 * FASE 2: passa a consultar a agenda real (capacidade diária) no Supabase.
 */

export async function GET() {
  const { diasParaFrente, antecedenciaMinimaDias, diasSemProducao } = config.agenda;
  const datas: string[] = [];
  const hoje = new Date();
  for (let i = antecedenciaMinimaDias; i <= diasParaFrente; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
    if (diasSemProducao.includes(d.getDay())) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    datas.push(iso);
  }
  return NextResponse.json({ datas });
}
