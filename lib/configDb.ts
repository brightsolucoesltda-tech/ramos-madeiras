/* Lê as configurações editáveis do banco; se falhar, usa os valores padrão de lib/config.ts. */
import { config, type Medida } from "./config";
import { admin } from "./supabase/admin";

export interface ConfigGeral {
  medidas: Medida[];
  adicionalVerniz: number;
  capacidadeDiaria: number;
  horasPorBanco: number;
  bancosPorViagem: number;
  diasSemProducao: number[];
  antecedenciaMinimaDias: number;
  diasParaFrente: number;
  promo: { ativa: boolean; texto: string };
  metaPixelId: string;
  mensagens: Record<string, string>;
}

export const configPadrao: ConfigGeral = {
  medidas: config.medidas as unknown as Medida[],
  adicionalVerniz: config.adicionalVerniz,
  capacidadeDiaria: 4,
  horasPorBanco: 1.5,
  bancosPorViagem: 2,
  diasSemProducao: config.agenda.diasSemProducao,
  antecedenciaMinimaDias: config.agenda.antecedenciaMinimaDias,
  diasParaFrente: config.agenda.diasParaFrente,
  promo: config.promo,
  metaPixelId: config.metaPixelId,
  mensagens: {
    em_producao: "Olá, {nome}! Seu banco-mesa (pedido nº {numero}) já está em produção. Assim que ficar pronto a gente avisa!",
    confirmado: "Olá, {nome}! Seu pedido nº {numero} está confirmado para {data}. Qualquer dúvida é só chamar. Ramos Madeiras",
    pronto: "Olá, {nome}! Seu banco-mesa (pedido nº {numero}) está pronto! Vamos combinar a entrega.",
    saiu_entrega: "Olá, {nome}! Estamos saindo para entregar o seu pedido nº {numero}. Em breve chegamos! Pagamento na entrega.",
    proposta: "Olá, {nome}! Para o pedido nº {numero}, conseguimos entregar em {data}. Pode ser?",
  },
};

export async function carregarConfig(): Promise<ConfigGeral> {
  try {
    const { data } = await admin().from("configuracoes").select("valor").eq("chave", "geral").maybeSingle();
    const v = (data?.valor ?? {}) as Partial<ConfigGeral>;
    // textos novos do padrão continuam aparecendo mesmo se o banco tiver uma versão antiga
    return { ...configPadrao, ...v, mensagens: { ...configPadrao.mensagens, ...(v.mensagens ?? {}) } };
  } catch {
    return configPadrao;
  }
}
