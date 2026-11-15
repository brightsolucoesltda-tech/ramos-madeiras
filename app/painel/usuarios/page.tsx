import { exigirPagina } from "@/lib/auth";
import { admin } from "@/lib/supabase/admin";
import { NovoUsuario, RemoverUsuario } from "./FormularioUsuario";

const PAPEL = { admin: "Administrador", vendedor: "Vendedor", marceneiro: "Marceneiro" } as const;

export default async function Usuarios() {
  const eu = await exigirPagina(["admin"]);
  const db = admin();
  const [{ data: perfis }, { data: lista }] = await Promise.all([db.from("perfis").select("id,nome,papel").order("criado_em"), db.auth.admin.listUsers({ perPage: 200 })]);
  const email = new Map((lista?.users ?? []).map((x) => [x.id, x.email]));
  return (
    <>
      <h1>Usuários</h1>
      <div className="p-lista">
        {(perfis ?? []).map((p) => (
          <div key={p.id} className="p-card">
            <b>{p.nome}</b>
            <small>{email.get(p.id) ?? "—"} · {PAPEL[p.papel as keyof typeof PAPEL]}</small>
            {p.id !== eu.id && <RemoverUsuario id={p.id} nome={p.nome} />}
          </div>
        ))}
      </div>
      <NovoUsuario />
    </>
  );
}
