/* ACEITE DO MARCENEIRO: pedidos novos ou com data pedida, esperando ele aceitar, propor outra data ou recusar. */
import { agendaDoPeriodo, proximoDiaComVaga } from "@/lib/agenda";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { hojeBR, somarDias } from "@/lib/datas";
import { descreverItens } from "@/lib/itens";
import { admin } from "@/lib/supabase/admin";
import CartaoAceite from "./CartaoAceite";

export default async function Aceite() {
  const u = await exigirPagina();
  const cfg = await carregarConfig();
  const hoje = hojeBR();
  const { data: pedidos } = await admin()
    .from("pedidos")
    .select("id,numero,status,aceite,cliente_nome,telefone,bairro,itens,bancos,data_agendada,data_desejada,data_proposta")
    .in("aceite", ["pendente", "proposto", "recusado"])
    .in("status", ["novo", "confirmado", "reagendado"])
    .order("criado_em", { ascending: true });

  // Ocupação dos próximos 60 dias, para mostrar "3/4 bancos" ao lado da data pedida
  const dias = await agendaDoPeriodo(cfg, hoje, somarDias(hoje, 60));
  const ocup = Object.fromEntries(dias.map((d) => [d.data, `${d.usados}/${d.capacidade}${d.bloqueado ? " · bloqueado" : d.semProducao ? " · sem produção" : ""}`]));
  const sugestao = (await proximoDiaComVaga(cfg, 1)) ?? "";
  const podeDecidir = u.papel !== "vendedor";

  const lista = pedidos ?? [];
  const pendentes = lista.filter((p) => p.aceite === "pendente");
  const outros = lista.filter((p) => p.aceite !== "pendente");

  return (
    <>
      <h1>Aceite de datas</h1>
      {!podeDecidir && <p className="p-aviso">Quem aceita as datas é o marceneiro. Aqui você acompanha o que está pendente.</p>}
      <h2>⏳ Aguardando decisão · {pendentes.length}</h2>
      {pendentes.length === 0 && <p className="p-card">Nenhum pedido esperando aceite. 👍</p>}
      {[...pendentes, ...outros].map((p, i) => (
        <div key={p.id} style={{ display: "contents" }}>
          {i === pendentes.length && outros.length > 0 && <h2>📨 Já respondidos (esperando o cliente / vendedor)</h2>}
          <CartaoAceite
            p={{
              id: p.id, numero: p.numero, status: p.status, aceite: p.aceite, nome: p.cliente_nome, telefone: p.telefone, bairro: p.bairro,
              itens: descreverItens(p.itens), bancos: p.bancos, dataPedida: p.data_agendada ?? p.data_desejada, dataProposta: p.data_proposta,
            }}
            ocupacao={ocup}
            sugestao={sugestao}
            mensagens={cfg.mensagens}
            podeDecidir={podeDecidir}
          />
        </div>
      ))}
    </>
  );
}
