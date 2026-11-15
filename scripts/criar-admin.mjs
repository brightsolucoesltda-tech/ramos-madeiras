// Cria (ou promove) um administrador do painel. Se o e-mail já existir, troca a senha e o nome.
// Uso:  node scripts/criar-admin.mjs "Seu Nome" email@exemplo.com SuaSenhaAqui
// A senha é escolhida por você e só passa por este comando, direto para o Supabase.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const [nome, email, senha] = process.argv.slice(2);
if (!nome || !email || !senha || senha.length < 8) {
  console.log('Uso: node scripts/criar-admin.mjs "Seu Nome" email@exemplo.com SenhaComPeloMenos8');
  process.exit(1);
}
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

let { data, error } = await db.auth.admin.createUser({ email, password: senha, email_confirm: true });
if (error) {
  // Se o e-mail já existe: atualiza a senha para a informada e promove a administrador
  const lista = await db.auth.admin.listUsers({ perPage: 200 });
  const existente = lista.data?.users.find((u) => u.email === email);
  if (!existente) { console.log("Erro:", error.message); process.exit(1); }
  const { error: e3 } = await db.auth.admin.updateUserById(existente.id, { password: senha, email_confirm: true });
  if (e3) { console.log("Erro ao atualizar a senha:", e3.message); process.exit(1); }
  console.log("E-mail já existia: senha atualizada.");
  data = { user: existente };
}
const { error: e2 } = await db.from("perfis").upsert({ id: data.user.id, nome, papel: "admin" });
console.log(e2 ? "Erro: " + e2.message : `Pronto! ${email} agora é administrador.`);
