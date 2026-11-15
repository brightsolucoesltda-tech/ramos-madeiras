/* Utilitários de data (sempre texto AAAA-MM-DD, no fuso de Brasília, sem pegadinhas de horário). */

/** Hoje em Brasília, como AAAA-MM-DD. */
export function hojeBR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

const paraUTC = (iso: string) => new Date(iso + "T12:00:00Z");

export function somarDias(iso: string, n: number): string {
  const d = paraUTC(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado */
export const diaSemana = (iso: string) => paraUTC(iso).getUTCDay();

/** Segunda-feira da semana da data informada. */
export function inicioSemana(iso: string): string {
  const d = diaSemana(iso);
  return somarDias(iso, d === 0 ? -6 : 1 - d);
}

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const nomeDiaCurto = (iso: string) => SEMANA[diaSemana(iso)];

/** 2026-11-15 -> 15/11/2026 */
export const dataBR = (iso?: string | null) => (iso ? iso.split("-").reverse().join("/") : "—");
/** 2026-11-15 -> dom 15/11 */
export const dataCurta = (iso: string) => `${nomeDiaCurto(iso)} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
