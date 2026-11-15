"use server";
/* AÇÕES DO PAINEL — tudo que grava dados passa por aqui, sempre conferindo login e perfil. */
import { revalidatePath } from "next/cache";
import { agendaDoPeriodo, proximoDiaComVaga } from "@/lib/agenda";
import { exigirAcao, type Papel } from "@/lib/auth";
import { carregarConfig, type ConfigGeral } from "@/lib/configDb";
import { dataBR, hojeBR, somarDias } from "@/lib/datas";
import { buscarCoordenadas } from "@/lib/geo";
import { STATUS, STATUS_MARCENEIRO, type Status } from "@/lib/status";
import { admin } from "@/lib/supabase/admin";


type Resp<T = object> = ({ ok: true } & T) | { ok: false; erro: string };
const falha = (e: unknown): { ok: false; erro: string } => ({ ok: false, erro: e instanceof Error ? e.message : "Erro inesperado" });
const atualizarTela = () => revalidatePath("/painel", "layout");

export interface ItemPedido {
  medidaId: string;
  acabId: string;
  quantidade: number;
}
export interface PedidoForm {
  id?: number;
  cliente_nome: string;
  telefone: string;
  endereco: string;
  bairro: string;
  cidade: string;
  referencia: string;
  itens: ItemPedido[];
  valor_total: number;
  taxa_entrega: number | null;
  forma_pagamento: string;
  data_desejada: string | null;
  observacoes: string;
  vendedor_id: string | null;
}

/** Cria ou edita um pedido (vendedor e admin). */
export async function salvarPedido(f: PedidoForm): Promise<Resp<{ id: number }>> {
  try {
    const u = await exigirAcao(["admin", "vendedor"]);
    if (!f.cliente_nome.trim()) return { ok: false, erro: "Informe o nome do cliente." };
    if (!f.itens.length) return { ok: false, erro: "Adicione pelo menos um item." };
    const bancos = f.itens.reduce((s, i) => s + (i.quantidade || 0), 0);
    const dados = {
      cliente_nome: f.cliente_nome.trim(),
      telefone: f.telefone.trim() || null,
      endereco: f.endereco.trim() || null,
      bairro: f.bairro.trim() || null,
      cidade: f.cidade.trim() || null,
      referencia: f.referencia.trim() || null,
      itens: f.itens,
      bancos,
      valor_total: f.valor_total || 0,
      taxa_entrega: f.taxa_entrega,
      forma_pagamento: f.forma_pagamento || null,
      data_desejada: f.data_desejada || null,
      observacoes: f.observacoes.trim() || null,
      vendedor_id: f.vendedor_id || u.id,
      atualizado_em: new Date().toISOString(),
    };
    const db = admin();
    // Coordenadas do endereço (para a rota). Só consulta quando o endereço é novo ou mudou.
    const enderecoCompleto = [dados.endereco, dados.bairro, dados.cidade].filter(Boolean).join(", ");
    let coords: { lat: number | null; lng: number | null } | undefined;
    if (!dados.endereco) coords = { lat: null, lng: null };
    else {
      const antigo = f.id ? (await db.from("pedidos").select("endereco,bairro,cidade,lat").eq("id", f.id).single()).data : null;
      const mudou = !antigo || antigo.lat == null || [antigo.endereco, antigo.bairro, antigo.cidade].filter(Boolean).join(", ") !== enderecoCompleto;
      if (mudou) coords = (await buscarCoordenadas(enderecoCompleto)) ?? { lat: null, lng: null };
    }
    const dadosFinais = coords ? { ...dados, ...coords } : dados;
    if (f.id) {
      const { error } = await db.from("pedidos").update(dadosFinais).eq("id", f.id);
      if (error) throw error;
      atualizarTela();
      return { ok: true, id: f.id };
    }
    const provisorio = `T${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const { data, error } = await db.from("pedidos").insert({ ...dadosFinais, numero: provisorio, canal: "manual", status: "novo" }).select("id").single();
    if (error || !data) throw error ?? new Error("Não foi possível salvar.");
    await db.from("pedidos").update({ numero: String(1000 + data.id) }).eq("id", data.id);
    atualizarTela();
    return { ok: true, id: data.id };
  } catch (e) {
    return falha(e);
  }
}

/** Muda o status. O marceneiro só mexe no andamento (produção/entrega). */
export async function mudarStatus(id: number, status: Status): Promise<Resp> {
  try {
    const u = await exigirAcao();
    if (!STATUS.includes(status)) throw new Error("Status inválido.");
    if (u.papel === "marceneiro" && !STATUS_MARCENEIRO.includes(status)) throw new Error("Esse status é do vendedor.");
    const { error } = await admin().from("pedidos").update({ status, atualizado_em: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Confere se cabe no dia. Devolve um texto de aviso (bloqueado, sem produção ou acima da capacidade) ou "" se couber. */
async function avisoCapacidade(id: number, data: string): Promise<string> {
  const db = admin();
  const cfg = await carregarConfig();
  const { data: este } = await db.from("pedidos").select("bancos,data_agendada,data_desejada").eq("id", id).single();
  const bancos = este?.bancos ?? 1;
  const [dia] = await agendaDoPeriodo(cfg, data, data);
  // Ocupação do dia sem contar este próprio pedido
  const jaContado = (este?.data_agendada ?? este?.data_desejada) === data ? bancos : 0;
  const usados = dia.usados - jaContado;
  if (dia.bloqueado) return `Esse dia está bloqueado${dia.motivo ? ` (${dia.motivo})` : ""}.`;
  if (dia.semProducao) return "Esse dia da semana não tem produção.";
  if (usados + bancos > dia.capacidade) return `Passa da capacidade: ficaria ${usados + bancos}/${dia.capacidade} bancos (encaixe / hora extra).`;
  return "";
}

/**
 * Agenda o pedido em um dia. Se passar da capacidade (ou o dia estiver bloqueado), devolve um AVISO
 * e só grava se o usuário confirmar (forcar = true): é o "encaixe/hora extra".
 * Se o VENDEDOR muda a data, o pedido volta para o aceite do marceneiro.
 */
export async function agendarPedido(id: number, data: string | null, forcar = false): Promise<Resp<{ aviso?: string }>> {
  try {
    const u = await exigirAcao(["admin", "vendedor", "marceneiro"]);
    if (data && !forcar) {
      const aviso = await avisoCapacidade(id, data);
      if (aviso) return { ok: true, aviso };
    }
    const { error } = await admin()
      .from("pedidos")
      .update({ data_agendada: data, aceite: u.papel === "vendedor" ? "pendente" : "aceito", ordem_rota: null, atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Sugere o próximo dia com vaga para N bancos. */
export async function sugerirDia(bancos: number, aPartirDe?: string): Promise<{ data: string | null }> {
  await exigirAcao();
  return { data: await proximoDiaComVaga(await carregarConfig(), bancos, aPartirDe) };
}

export async function bloquearDia(data: string, motivo: string): Promise<Resp> {
  try {
    await exigirAcao(["admin", "marceneiro"]);
    const { error } = await admin().from("dias_bloqueados").upsert({ data, motivo: motivo.trim() || "Folga" });
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function desbloquearDia(data: string): Promise<Resp> {
  try {
    await exigirAcao(["admin", "marceneiro"]);
    const { error } = await admin().from("dias_bloqueados").delete().eq("data", data);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Salva as configurações (preços, capacidade, textos...). Só admin. */
export async function salvarConfig(cfg: ConfigGeral): Promise<Resp> {
  try {
    await exigirAcao(["admin"]);
    const { error } = await admin().from("configuracoes").upsert({ chave: "geral", valor: cfg, atualizado_em: new Date().toISOString() });
    if (error) throw error;
    revalidatePath("/"); // atualiza o site público
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Cria um usuário do painel (admin escolhe e-mail, senha e perfil). */
export async function criarUsuario(v: { email: string; senha: string; nome: string; papel: Papel }): Promise<Resp> {
  try {
    await exigirAcao(["admin"]);
    if (v.senha.length < 8) return { ok: false, erro: "A senha precisa ter pelo menos 8 caracteres." };
    if (!v.nome.trim() || !v.email.trim()) return { ok: false, erro: "Informe nome e e-mail." };
    const db = admin();
    const { data, error } = await db.auth.admin.createUser({ email: v.email.trim(), password: v.senha, email_confirm: true });
    if (error || !data.user) throw new Error(error?.message ?? "Não foi possível criar o usuário.");
    const { error: e2 } = await db.from("perfis").insert({ id: data.user.id, nome: v.nome.trim(), papel: v.papel });
    if (e2) throw e2;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function removerUsuario(id: string): Promise<Resp> {
  try {
    const eu = await exigirAcao(["admin"]);
    if (eu.id === id) return { ok: false, erro: "Você não pode remover a si mesmo." };
    const { error } = await admin().auth.admin.deleteUser(id);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Dados de EXEMPLO para testar agenda e rotas (podem ser apagados depois). */
export async function criarExemplos(): Promise<Resp<{ criados: number }>> {
  try {
    const u = await exigirAcao(["admin"]);
    const db = admin();
    const hoje = hojeBR();
    const clientes: [string, string, string, string, string, number, string, number, Status][] = [
      // nome, bairro, cidade, medida, acabamento, qtd, rua, dia(+), status
      ["Ana Souza", "Água Verde", "Curitiba", "160x135", "mogno", 1, "Rua Exemplo, 100", 3, "confirmado"],
      ["Carlos Lima", "Batel", "Curitiba", "120x135", "natural", 2, "Av. Exemplo, 250", 3, "confirmado"],
      ["Marta Dias", "Portão", "Curitiba", "180x135", "embuia", 1, "Rua das Flores, 45", 3, "novo"],
      ["João Pereira", "Santa Felicidade", "Curitiba", "100x135", "natural", 1, "Rua Exemplo, 8", 4, "confirmado"],
      ["Luciana Reis", "Boa Vista", "Curitiba", "200x135", "mogno", 1, "Rua Exemplo, 77", 4, "confirmado"],
      ["Pedro Alves", "Cajuru", "Curitiba", "160x135", "natural", 2, "Rua Exemplo, 310", 4, "novo"],
      ["Rita Moraes", "Pinheirinho", "Curitiba", "120x135", "mogno", 1, "Rua Exemplo, 15", 5, "confirmado"],
      ["Sérgio Costa", "Sítio Cercado", "Curitiba", "160x135", "natural", 1, "Rua Exemplo, 90", 5, "novo"],
      ["Paula Nunes", "Centro", "São José dos Pinhais", "180x135", "natural", 1, "Rua Exemplo, 12", 6, "confirmado"],
      ["Bruno Faria", "Hauer", "Curitiba", "100x135", "embuia", 1, "Rua Exemplo, 60", 6, "novo"],
      ["Elaine Rocha", "Bacacheri", "Curitiba", "160x135", "mogno", 1, "Rua Exemplo, 33", 7, "novo"],
      ["Tiago Martins", "Centro", "Pinhais", "200x135", "natural", 1, "Rua Exemplo, 21", 7, "novo"],
      ["Vera Campos", "CIC", "Curitiba", "120x135", "natural", 1, "Rua Exemplo, 5", -2, "entregue"],
      ["Otávio Brito", "Mercês", "Curitiba", "160x135", "mogno", 1, "Rua Exemplo, 140", -1, "entregue"],
    ];
    const cfg = await carregarConfig();
    const linhas = clientes.map(([nome, bairro, cidade, medidaId, acabId, quantidade, rua, dia, status], i) => {
      const m = cfg.medidas.find((x) => x.id === medidaId)!;
      const verniz = acabId !== "natural" ? cfg.adicionalVerniz : 0;
      return {
        numero: `EX-${i + 1}`,
        status,
        cliente_nome: nome,
        telefone: "41999990000",
        endereco: rua,
        bairro,
        cidade,
        itens: [{ medidaId, acabId, quantidade }],
        bancos: quantidade,
        valor_total: (m.preco + verniz) * quantidade,
        taxa_entrega: 20,
        forma_pagamento: "Pix na entrega",
        data_desejada: somarDias(hoje, dia),
        data_agendada: status === "novo" ? null : somarDias(hoje, dia),
        observacoes: "EXEMPLO — pode apagar",
        aceite: status === "novo" ? "pendente" : "aceito",
        canal: "exemplo",
        origem: i % 2 ? "facebook" : "instagram",
        vendedor_id: u.id,
      };
    });
    const { error } = await db.from("pedidos").insert(linhas);
    if (error) throw error;
    atualizarTela();
    return { ok: true, criados: linhas.length };
  } catch (e) {
    return falha(e);
  }
}

export async function apagarExemplos(): Promise<Resp> {
  try {
    await exigirAcao(["admin"]);
    const { error } = await admin().from("pedidos").delete().eq("canal", "exemplo");
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/**
 * Registra que o cliente foi avisado pelo WhatsApp (tipo = pronto, em_producao, saiu_entrega, confirmado, proposta).
 * Se `novoStatus` vier, muda o status junto ("Marcar como pronto e avisar").
 * Se `dataProposta` vier, guarda a data sugerida ao cliente.
 */
export async function avisoEnviado(id: number, tipo: string, novoStatus?: Status, dataProposta?: string): Promise<Resp> {
  try {
    const u = await exigirAcao();
    if (novoStatus) {
      if (!STATUS.includes(novoStatus)) throw new Error("Status inválido.");
      if (u.papel === "marceneiro" && !STATUS_MARCENEIRO.includes(novoStatus)) throw new Error("Esse status é do vendedor.");
    }
    const db = admin();
    const { data: p, error: e1 } = await db.from("pedidos").select("avisos").eq("id", id).single();
    if (e1) throw e1;
    const mudancas: Record<string, unknown> = {
      avisos: { ...((p?.avisos as Record<string, string>) ?? {}), [tipo]: new Date().toISOString() },
      atualizado_em: new Date().toISOString(),
    };
    if (novoStatus) mudancas.status = novoStatus;
    if (dataProposta) {
      mudancas.data_proposta = dataProposta;
      mudancas.aceite = "proposto";
    }
    const { error } = await db.from("pedidos").update(mudancas).eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/* ===================== FASE 3: ACEITE DO MARCENEIRO ===================== */

/** Marceneiro ACEITA a data pedida (agendada ou desejada). Avisa se passar da capacidade. */
export async function aceitarData(id: number, forcar = false): Promise<Resp<{ aviso?: string; data?: string }>> {
  try {
    await exigirAcao(["admin", "marceneiro"]);
    const db = admin();
    const { data: p } = await db.from("pedidos").select("status,data_agendada,data_desejada").eq("id", id).single();
    const data = p?.data_agendada ?? p?.data_desejada;
    if (!data) return { ok: false, erro: "Esse pedido não tem data. Use 'Propor outra data'." };
    if (!forcar) {
      const aviso = await avisoCapacidade(id, data);
      if (aviso) return { ok: true, aviso };
    }
    const status = p && ["novo", "reagendado"].includes(p.status) ? "confirmado" : p?.status;
    const { error } = await db.from("pedidos").update({ data_agendada: data, aceite: "aceito", status, atualizado_em: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true, data };
  } catch (e) {
    return falha(e);
  }
}

/** Marceneiro PROPÕE outra data (o cliente ainda precisa concordar). */
export async function proporOutraData(id: number, data: string): Promise<Resp> {
  try {
    await exigirAcao(["admin", "marceneiro"]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, erro: "Escolha uma data." };
    const { error } = await admin()
      .from("pedidos")
      .update({ data_proposta: data, aceite: "proposto", status: "reagendado", atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Marceneiro RECUSA a data. O vendedor vê o aviso e combina outra com o cliente. */
export async function recusarData(id: number): Promise<Resp> {
  try {
    await exigirAcao(["admin", "marceneiro"]);
    const { error } = await admin().from("pedidos").update({ aceite: "recusado", atualizado_em: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Cliente concordou com a data proposta: vira a data agendada e o pedido fica confirmado. */
export async function clienteAceitouProposta(id: number): Promise<Resp<{ data?: string }>> {
  try {
    await exigirAcao();
    const db = admin();
    const { data: p } = await db.from("pedidos").select("data_proposta").eq("id", id).single();
    if (!p?.data_proposta) return { ok: false, erro: "Não há data proposta." };
    const { error } = await db
      .from("pedidos")
      .update({ data_agendada: p.data_proposta, aceite: "aceito", status: "confirmado", ordem_rota: null, atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    atualizarTela();
    return { ok: true, data: dataBR(p.data_proposta) };
  } catch (e) {
    return falha(e);
  }
}

/* ===================== FASE 3: ROTAS ===================== */

/** Só o patrão (administrador) e o marceneiro mexem na rota. */
const PODE_EDITAR_ROTA: Papel[] = ["admin", "marceneiro"];

/** Salva a ordem das entregas do dia (edição na mão). Editar desfaz a aprovação: precisa aprovar de novo. */
export async function salvarOrdemRota(dia: string, ids: number[]): Promise<Resp> {
  try {
    await exigirAcao(PODE_EDITAR_ROTA);
    const db = admin();
    for (const [i, id] of ids.entries()) {
      const { error } = await db.from("pedidos").update({ ordem_rota: i + 1 }).eq("id", id);
      if (error) throw error;
    }
    await db.from("rotas_dia").delete().eq("data", dia);
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Volta para a ordem sugerida automaticamente (pela proximidade). Também desfaz a aprovação. */
export async function limparOrdemRota(dia: string, ids: number[]): Promise<Resp> {
  try {
    await exigirAcao(PODE_EDITAR_ROTA);
    const db = admin();
    const { error } = await db.from("pedidos").update({ ordem_rota: null }).in("id", ids);
    if (error) throw error;
    await db.from("rotas_dia").delete().eq("data", dia);
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Patrão APROVA a rota do dia como está na tela: a ordem fica gravada e vale para todos. */
export async function aprovarRota(dia: string, ids: number[]): Promise<Resp> {
  try {
    const u = await exigirAcao(PODE_EDITAR_ROTA);
    const db = admin();
    for (const [i, id] of ids.entries()) {
      const { error } = await db.from("pedidos").update({ ordem_rota: i + 1 }).eq("id", id);
      if (error) throw error;
    }
    const { error } = await db.from("rotas_dia").upsert({ data: dia, aprovada_por: u.id, aprovada_em: new Date().toISOString() });
    if (error) throw error;
    atualizarTela();
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Busca as coordenadas de um endereço (usado na config para o ponto de saída). */
export async function coordenadasDoEndereco(endereco: string): Promise<Resp<{ lat?: number; lng?: number }>> {
  await exigirAcao(["admin"]);
  const c = await buscarCoordenadas(endereco);
  return c ? { ok: true, ...c } : { ok: false, erro: "Não encontrei esse endereço. Tente com rua, número, bairro e cidade." };
}
