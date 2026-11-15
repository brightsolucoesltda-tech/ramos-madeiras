/* Menu fixo embaixo (celular). O marceneiro vê "Meu dia" primeiro; o contador mostra datas esperando aceite. */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Papel } from "@/lib/auth";

const ITENS = [
  { href: "/painel", icone: "📋", nome: "Pedidos", ativoEm: ["/painel/pedidos"] },
  { href: "/painel/meu-dia", icone: "🛠️", nome: "Meu dia", ativoEm: [] },
  { href: "/painel/avisar", icone: "💬", nome: "Avisar", ativoEm: [] },
  { href: "/painel/agenda", icone: "📅", nome: "Agenda", ativoEm: [] },
  { href: "/painel/mais", icone: "☰", nome: "Mais", ativoEm: ["/painel/aceite", "/painel/resumo", "/painel/config", "/painel/usuarios"] },
];

export default function Nav({ papel, aceitePendente }: { papel: Papel; aceitePendente: number }) {
  const caminho = usePathname();
  // Para o marceneiro, "Meu dia" vem primeiro
  const itens = papel === "marceneiro" ? [ITENS[1], ITENS[0], ...ITENS.slice(2)] : ITENS;
  return (
    <nav className="p-nav">
      {itens.map((i) => {
        const ativo = (i.href === "/painel" ? caminho === "/painel" : caminho.startsWith(i.href)) || i.ativoEm.some((x) => caminho.startsWith(x));
        const contador = i.href === "/painel/mais" && papel !== "vendedor" ? aceitePendente : 0;
        return (
          <Link key={i.href} href={i.href} className={ativo ? "ativo" : ""} style={{ position: "relative" }}>
            <span>{i.icone}</span>{i.nome}
            {contador > 0 && <em className="p-contador">{contador}</em>}
          </Link>
        );
      })}
    </nav>
  );
}
