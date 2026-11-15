/* AVISAR CLIENTES: todos os avisos de WhatsApp numa tela só, separados por grupo. */
import { proximoDiaComVaga } from "@/lib/agenda";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { hojeBR } from "@/lib/datas";
import { descreverItens } from "@/lib/itens";
import { admin } from "@/lib/supabase/admin";
import ListaAvisos, { type Grupo, type LinhaAviso } from "./ListaAvisos";

export default async function Avisar() {
  const u = await exigirPagina();
  const cfg = await carregarConfig();
  const hoje = hojeBR();
  const { data: pedidos } = await admin()
    .from("pedidos")
    .select("id,numero,status,cliente_nome,telefone,bairro,itens,bancos,data_agendada,data_desejada,data_proposta,avisos")
    .not("status", "in", "(entregue,cancelado)")
    .order("data_agendada", { ascending: true, nullsFirst: false });
  const sugestao = (await proximoDiaComVaga(cfg, 1)) ?? "";

  const grupos: Record<Grupo, LinhaAviso[]> = { hoje: [], pronto: [], producao: [], confirmar: [], data: [] };
  for (const p of pedidos ?? []) {
    const linha: LinhaAviso = {
      id: p.id,
      numero: p.numero,
      status: p.status,
      nome: p.cliente_nome,
      telefone: p.telefone,
      bairro: p.bairro,
      itens: descreverItens(p.itens),
      data: p.data_agendada,
      // Data para propor: a desejada pelo cliente (se ainda não passou), senão a próxima com vaga
      dataSugerida: p.data_proposta ?? (p.data_desejada && p.data_desejada >= hoje ? p.data_desejada : sugestao),
      avisos: (p.avisos as Record<string, string>) ?? {},
    };
    // Cada pedido aparece em um grupo só, na ordem de prioridade abaixo
    if (p.data_agendada === hoje && ["confirmado", "em_producao", "pronto", "saiu_entrega"].includes(p.status)) grupos.hoje.push(linha);
    else if (p.status === "pronto") grupos.pronto.push(linha);
    else if (p.status === "em_producao") grupos.producao.push(linha);
    else if (p.status === "confirmado" && p.data_agendada) grupos.confirmar.push(linha);
    else grupos.data.push(linha);
  }

  return (
    <>
      <h1>Avisar clientes</h1>
      <p className="p-card" style={{ fontSize: ".92rem" }}>
        Toque no botão verde: o WhatsApp abre com a mensagem pronta, é só apertar <b>Enviar</b> e voltar aqui. O cliente fica marcado como <b>✓ avisado</b>.
      </p>
      <ListaAvisos grupos={grupos} mensagens={cfg.mensagens} papel={u.papel} />
    </>
  );
}
