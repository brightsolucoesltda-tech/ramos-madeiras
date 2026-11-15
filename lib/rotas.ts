/* ROTAS DE ENTREGA: ordena as entregas do dia pela proximidade e divide em viagens. */
import { distanciaKm, normalizar } from "./geo";

export interface Parada {
  id: number;
  numero: string;
  status: string;
  cliente_nome: string | null;
  telefone: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  referencia: string | null;
  bancos: number;
  itens: string;
  lat: number | null;
  lng: number | null;
  ordem_rota: number | null;
  avisos: Record<string, string>;
}
export interface Bairro {
  nome: string;
  cidade: string;
  lat: number;
  lng: number;
}
export type Ponto = { lat: number; lng: number };

/** Coordenada da parada: a do endereço (se foi encontrada) ou a do bairro. */
export function coordenada(p: Parada, bairros: Bairro[]): Ponto | null {
  if (p.lat != null && p.lng != null) return { lat: p.lat, lng: p.lng };
  const nome = normalizar(p.bairro);
  if (!nome) return null;
  const cidade = normalizar(p.cidade);
  const b =
    bairros.find((x) => normalizar(x.nome) === nome && (!cidade || normalizar(x.cidade) === cidade)) ??
    bairros.find((x) => normalizar(x.nome) === nome) ??
    // Ex.: cidade "Pinhais" sem bairro conhecido → usa o centro da cidade
    bairros.find((x) => normalizar(x.nome) === "centro" && normalizar(x.cidade) === cidade);
  return b ? { lat: b.lat, lng: b.lng } : null;
}

/**
 * Ordem das entregas:
 * - se alguém já arrumou a ordem na mão (todas com ordem_rota), respeita;
 * - senão, sai da marcenaria e vai sempre para a entrega MAIS PERTO ainda não feita (vizinho mais próximo).
 *   Entregas sem coordenada vão para o fim, agrupadas por bairro.
 */
export function ordenar(paradas: Parada[], base: Ponto, bairros: Bairro[]): { lista: Parada[]; manual: boolean } {
  if (paradas.length && paradas.every((p) => p.ordem_rota != null)) {
    return { lista: [...paradas].sort((a, b) => a.ordem_rota! - b.ordem_rota!), manual: true };
  }
  const comCoord = paradas.map((p) => ({ p, c: coordenada(p, bairros) }));
  const restantes = comCoord.filter((x) => x.c);
  const semCoord = comCoord.filter((x) => !x.c).map((x) => x.p).sort((a, b) => normalizar(a.bairro).localeCompare(normalizar(b.bairro)));
  const lista: Parada[] = [];
  let atual = base;
  while (restantes.length) {
    let melhor = 0;
    for (let i = 1; i < restantes.length; i++) {
      if (distanciaKm(atual, restantes[i].c!) < distanciaKm(atual, restantes[melhor].c!)) melhor = i;
    }
    const [prox] = restantes.splice(melhor, 1);
    lista.push(prox.p);
    atual = prox.c!;
  }
  return { lista: [...lista, ...semCoord], manual: false };
}

/** Divide a sequência em viagens de até `capacidade` bancos (um pedido maior que isso vai sozinho). */
export function dividirViagens(lista: Parada[], capacidade: number): Parada[][] {
  const viagens: Parada[][] = [];
  let atual: Parada[] = [];
  let soma = 0;
  for (const p of lista) {
    if (atual.length && soma + p.bancos > capacidade) {
      viagens.push(atual);
      atual = [];
      soma = 0;
    }
    atual.push(p);
    soma += p.bancos;
  }
  if (atual.length) viagens.push(atual);
  return viagens;
}

/** Texto do endereço para o Google Maps. */
export const enderecoMaps = (p: Parada) =>
  [p.endereco, p.bairro, p.cidade].filter(Boolean).join(", ") || [p.bairro, p.cidade].filter(Boolean).join(", ");

/** Link do Google Maps com as paradas na ordem, saindo e voltando para a marcenaria (sem API paga). */
export function linkGoogleMaps(base: { endereco: string; lat: number; lng: number }, paradas: Parada[]) {
  const origem = base.endereco?.trim() || `${base.lat},${base.lng}`;
  const params = new URLSearchParams({ api: "1", origin: origem, destination: origem, travelmode: "driving" });
  if (paradas.length) params.set("waypoints", paradas.map(enderecoMaps).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
