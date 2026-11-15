/* MAIS: atalhos que não cabem no menu de baixo. */
import Link from "next/link";
import { exigirPagina } from "@/lib/auth";

export default async function Mais() {
  const u = await exigirPagina();
  const itens: { href: string; icone: string; nome: string; desc: string; so?: "admin" }[] = [
    { href: "/painel/aceite", icone: "✅", nome: "Aceite de datas", desc: "Aceitar, propor outra data ou recusar" },
    { href: "/painel/resumo", icone: "📊", nome: "Resumo", desc: "Pedidos, bancos x capacidade e vendas" },
    { href: "/painel/config", icone: "⚙️", nome: "Configurações", desc: "Preços, capacidade, textos, ponto de saída", so: "admin" },
    { href: "/painel/usuarios", icone: "👥", nome: "Usuários", desc: "Equipe, perfis e senhas", so: "admin" },
  ];
  return (
    <>
      <h1>Mais</h1>
      <div className="p-lista">
        {itens.filter((i) => !i.so || u.papel === i.so).map((i) => (
          <Link key={i.href} href={i.href} className="p-item">
            <b>{i.icone} {i.nome}</b>
            <small>{i.desc}</small>
          </Link>
        ))}
      </div>
    </>
  );
}
