/* AGENDA COM CAPACIDADE: quantos bancos cabem por dia, dias bloqueados e sugestão de vaga. */
import type { ConfigGeral } from "./configDb";
import { diaSemana, hojeBR, somarDias } from "./datas";
import { admin } from "./supabase/admin";

export interface DiaAgenda {
  data: string;
  usados: number; // bancos já ocupando o dia
  capacidade: number;
  bloqueado: boolean;
  motivo?: string;
  semProducao: boolean; // dia da semana sem produção (ex.: domingo)
}

/** Situação de cada dia entre [inicio, fim]. O dia de um pedido é a data agendada, ou a desejada enquanto não agendado. */
export async function agendaDoPeriodo(cfg: ConfigGeral, inicio: string, fim: string): Promise<DiaAgenda[]> {
  const db = admin();
  const [{ data: pedidos, error: e1 }, { data: bloqueios, error: e2 }] = await Promise.all([
    db
      .from("pedidos")
      .select("bancos,data_agendada,data_desejada")
      .neq("status", "cancelado")
      .or(`and(data_agendada.gte.${inicio},data_agendada.lte.${fim}),and(data_agendada.is.null,data_desejada.gte.${inicio},data_desejada.lte.${fim})`),
    db.from("dias_bloqueados").select("data,motivo").gte("data", inicio).lte("data", fim),
  ]);
  if (e1 || e2) throw new Error((e1 ?? e2)!.message); // não esconde erro: melhor avisar do que mostrar agenda vazia
  const usados: Record<string, number> = {};
  for (const p of pedidos ?? []) {
    const dia = p.data_agendada ?? p.data_desejada;
    if (dia) usados[dia] = (usados[dia] ?? 0) + (p.bancos ?? 1);
  }
  const bloq = new Map((bloqueios ?? []).map((b) => [b.data as string, b.motivo as string | null]));
  const dias: DiaAgenda[] = [];
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) {
    dias.push({
      data: d,
      usados: usados[d] ?? 0,
      capacidade: cfg.capacidadeDiaria,
      bloqueado: bloq.has(d),
      motivo: bloq.get(d) ?? undefined,
      semProducao: cfg.diasSemProducao.includes(diaSemana(d)),
    });
  }
  return dias;
}

/** Cor da barra: verde (folga), amarelo (quase cheio), vermelho (cheio ou acima). */
export function corOcupacao(d: Pick<DiaAgenda, "usados" | "capacidade">): "verde" | "amarelo" | "vermelho" {
  if (d.usados >= d.capacidade) return "vermelho";
  if (d.usados / d.capacidade >= 0.75) return "amarelo";
  return "verde";
}

export const diaLivre = (d: DiaAgenda, bancos = 1) => !d.bloqueado && !d.semProducao && d.usados + bancos <= d.capacidade;

/** Datas com vaga para o site público (a partir da antecedência mínima). */
export async function datasDisponiveis(cfg: ConfigGeral): Promise<string[]> {
  const hoje = hojeBR();
  const ini = somarDias(hoje, cfg.antecedenciaMinimaDias);
  const fim = somarDias(hoje, cfg.diasParaFrente);
  return (await agendaDoPeriodo(cfg, ini, fim)).filter((d) => diaLivre(d)).map((d) => d.data);
}

/** Próximo dia com vaga para `bancos` bancos, a partir de uma data (procura até 120 dias). */
export async function proximoDiaComVaga(cfg: ConfigGeral, bancos: number, aPartirDe?: string): Promise<string | null> {
  const ini = aPartirDe && aPartirDe >= hojeBR() ? aPartirDe : hojeBR();
  const dias = await agendaDoPeriodo(cfg, ini, somarDias(ini, 120));
  return dias.find((d) => diaLivre(d, bancos))?.data ?? null;
}
