/* Menu fixo embaixo (celular). Mostra só o que o perfil pode usar. */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@/lib/auth";

const ITENS: { href: string; icone: string; nome: string; papeis?: Papel[] }[] = [
  { href: "/painel", icone: "📋", nome: "Pedidos" },
  { href: "/painel/agenda", icone: "📅", nome: "Agenda" },
  { href: "/painel/resumo", icone: "📊", nome: "Resumo" },
  { href: "/painel/config", icone: "⚙️", nome: "Config", papeis: ["admin"] },
  { href: "/painel/usuarios", icone: "👥", nome: "Usuários", papeis: ["admin"] },
];

export default function Nav({ papel }: { papel: Papel }) {
  const caminho = usePathname();
  return (
    <nav className="p-nav">
      {ITENS.filter((i) => !i.papeis || i.papeis.includes(papel)).map((i) => {
        const ativo = i.href === "/painel" ? caminho === "/painel" || caminho.startsWith("/painel/pedidos") : caminho.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} className={ativo ? "ativo" : ""}>
            <span>{i.icone}</span>{i.nome}
          </Link>
        );
      })}
    </nav>
  );
}
