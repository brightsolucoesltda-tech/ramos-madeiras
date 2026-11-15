/* Cliente do Supabase com a chave SECRETA. Só roda no servidor (nunca no navegador). */
import { createClient } from "@supabase/supabase-js";

export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
