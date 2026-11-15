/* Quem está logado e qual é o perfil (admin, vendedor, marceneiro). */
import { redirect } from "next/navigation";
import { admin } from "./supabase/admin";
import { supabaseServidor } from "./supabase/server";

export type Papel = "admin" | "vendedor" | "marceneiro";
export interface Usuario {
  id: string;
  nome: string;
  papel: Papel;
}

export async function usuarioAtual(): Promise<Usuario | null> {
  const sb = await supabaseServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await admin().from("perfis").select("id,nome,papel").eq("id", user.id).maybeSingle();
  return (data as Usuario) ?? null;
}

/** Para páginas: sem login vai para o login; sem permissão vai para o início. */
export async function exigirPagina(papeis?: Papel[]) {
  const u = await usuarioAtual();
  if (!u) redirect("/painel/login");
  if (papeis && !papeis.includes(u.papel)) redirect("/painel");
  return u;
}

/** Para ações do servidor: lança erro se não tiver permissão. */
export async function exigirAcao(papeis?: Papel[]) {
  const u = await usuarioAtual();
  if (!u) throw new Error("Faça login novamente.");
  if (papeis && !papeis.includes(u.papel)) throw new Error("Você não tem permissão para isso.");
  return u;
}
