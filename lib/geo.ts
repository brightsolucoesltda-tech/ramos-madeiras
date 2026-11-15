/* Coordenadas de um endereço usando o OpenStreetMap (Nominatim) — gratuito, sem chave.
   Regras de uso do serviço: poucas consultas, com identificação. Se falhar, seguimos sem coordenada. */

export async function buscarCoordenadas(endereco: string): Promise<{ lat: number; lng: number } | null> {
  if (!endereco.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(endereco)}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "painel-pedidos-marcenaria/1.0", "Accept-Language": "pt-BR" },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const [achado] = (await r.json()) as { lat: string; lon: string }[];
    return achado ? { lat: Number(achado.lat), lng: Number(achado.lon) } : null;
  } catch {
    return null;
  }
}

/** Distância aproximada em km entre dois pontos (fórmula de Haversine). */
export function distanciaKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Compara nomes de bairro sem acento e sem diferença de maiúsculas. */
export const normalizar = (t?: string | null) =>
  (t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
