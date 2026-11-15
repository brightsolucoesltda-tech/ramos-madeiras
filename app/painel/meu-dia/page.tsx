/* MEU DIA (marceneiro): o que produzir, em que ordem, e as viagens de entrega do dia. */
import Link from "next/link";
import { exigirPagina } from "@/lib/auth";
import { carregarConfig } from "@/lib/configDb";
import { dataCurta, hojeBR, somarDias } from "@/lib/datas";
import { descreverItens } from "@/lib/itens";
import { ordenar, type Bairro, type Parada } from "@/lib/rotas";
import { admin } from "@/lib/supabase/admin";
import ViagensDia from "./ViagensDia";

export default async function MeuDia({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const u = await exigirPagina();
  const q = await searchParams;
  const hoje = hojeBR();
  const dia = q.dia && /^\d{4}-\d{2}-\d{2}$/.test(q.dia) ? q.dia : hoje;
  const cfg = await carregarConfig();
  const db = admin();

  const [{ data: pedidos }, { data: bairros }, { count: aguardandoAceite }] = await Promise.all([
    db
      .from("pedidos")
      .select("id,numero,status,cliente_nome,telefone,endereco,bairro,cidade,referencia,bancos,itens,lat,lng,ordem_rota,avisos")
      .eq("data_agendada", dia)
      .neq("status", "cancelado"),
    db.from("bairros").select("nome,cidade,lat,lng"),
    db.from("pedidos").select("id", { count: "exact", head: true }).eq("aceite", "pendente").in("status", ["novo", "confirmado", "reagendado"]),
  ]);

  const paradas: Parada[] = (pedidos ?? []).map((p) => ({
    id: p.id, numero: p.numero, status: p.status, cliente_nome: p.cliente_nome, telefone: p.telefone, endereco: p.endereco, bairro: p.bairro,
    cidade: p.cidade, referencia: p.referencia, bancos: p.bancos, itens: descreverItens(p.itens), lat: p.lat, lng: p.lng, ordem_rota: p.ordem_rota,
    avisos: (p.avisos as Record<string, string>) ?? {},
  }));
  const { lista, manual } = ordenar(paradas, cfg.base, (bairros ?? []) as Bairro[]);
  const totalBancos = lista.reduce((s, p) => s + p.bancos, 0);
  const horas = (b: number) => `${(b * cfg.horasPorBanco).toString().replace(".", ",")}h`;
  const link = (d: string) => `/painel/meu-dia?dia=${d}`;

  return (
    <>
      <h1>Meu dia</h1>
      {u.papel !== "vendedor" && (aguardandoAceite ?? 0) > 0 && (
        <Link href="/painel/aceite" className="p-aviso" style={{ textDecoration: "none" }}>🔔 {aguardandoAceite} pedido(s) esperando você aceitar a data → ver</Link>
      )}
      <div className="p-nav-dias">
        <Link className="p-btn claro" href={link(somarDias(dia, -1))}>←</Link>
        <div style={{ textAlign: "center" }}>
          <b style={{ textTransform: "capitalize" }}>{dataCurta(dia)}{dia === hoje ? " · hoje" : ""}</b>
          <div><small>{totalBancos} banco{totalBancos === 1 ? "" : "s"} · {horas(totalBancos)} de produção · capacidade {cfg.capacidadeDiaria}</small></div>
        </div>
        <Link className="p-btn claro" href={link(somarDias(dia, 1))}>→</Link>
      </div>
      {dia !== hoje && <Link className="p-btn claro" href={link(hoje)}>Voltar para hoje</Link>}

      {lista.length === 0 ? (
        <p className="p-card">Nada agendado para este dia.</p>
      ) : (
        <ViagensDia
          key={dia + lista.map((p) => p.id).join(",")}
          paradasIniciais={lista}
          manual={manual}
          bancosPorViagem={cfg.bancosPorViagem}
          horasPorBanco={cfg.horasPorBanco}
          base={cfg.base}
          mensagens={cfg.mensagens}
          papel={u.papel}
        />
      )}
    </>
  );
}
