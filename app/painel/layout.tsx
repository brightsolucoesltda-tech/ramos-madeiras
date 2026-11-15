import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { usuarioAtual } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { supabaseServidor } from "@/lib/supabase/server";
import Nav from "./Nav";
import "./painel.css";

export const metadata: Metadata = { title: "Painel | Ramos Madeiras", robots: { index: false, follow: false } };

const ROTULO_PAPEL = { admin: "Administrador", vendedor: "Vendedor", marceneiro: "Marceneiro" } as const;

export default async function PainelLayout({ children }: { children: React.ReactNode }) {
  const u = await usuarioAtual();
  // Sem perfil: mostra só o conteúdo (tela de login).
  if (!u) return <>{children}</>;

  const { count: aceitePendente } = await admin()
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("aceite", "pendente")
    .in("status", ["novo", "confirmado", "reagendado"]);

  async function sair() {
    "use server";
    const sb = await supabaseServidor();
    await sb.auth.signOut();
    redirect("/painel/login");
  }

  return (
    <div className="p-app">
      <header className="p-topo">
        <div>
          <b>Ramos Madeiras</b>
          <small>{u.nome} · {ROTULO_PAPEL[u.papel]}</small>
        </div>
        <form action={sair}><button type="submit">Sair</button></form>
      </header>
      <main className="p-main">{children}</main>
      <Nav papel={u.papel} aceitePendente={aceitePendente ?? 0} />
    </div>
  );
}
