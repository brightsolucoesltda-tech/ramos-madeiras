import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { admin } from "@/lib/supabase/admin";
import FormularioPedido from "../FormularioPedido";

export default async function NovoPedido() {
  const u = await exigirPagina(["admin", "vendedor"]);
  const cfg = await carregarConfig();
  const db = admin();
  const [{ data: vend }, { data: bairros }] = await Promise.all([db.from("perfis").select("id,nome").in("papel", ["vendedor", "admin"]), db.from("bairros").select("nome")]);
  return (
    <>
      <h1>Novo pedido</h1>
      <FormularioPedido
        tabela={{ medidas: cfg.medidas, adicionalVerniz: cfg.adicionalVerniz }}
        vendedores={vend ?? []}
        bairros={[...new Set((bairros ?? []).map((b) => b.nome))]}
        inicial={{
          cliente_nome: "", telefone: "", endereco: "", bairro: "", cidade: "", referencia: "",
          itens: [{ medidaId: cfg.medidas[2]?.id ?? cfg.medidas[0].id, acabId: "natural", quantidade: 1 }],
          valor_total: 0, taxa_entrega: null, forma_pagamento: "", data_desejada: null, observacoes: "", vendedor_id: u.id,
        }}
      />
    </>
  );
}
