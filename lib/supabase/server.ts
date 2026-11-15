/* Cliente do Supabase ligado ao login (cookies) do usuário, para uso no servidor. */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function supabaseServidor() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (lista) => {
        try {
          lista.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          /* em Server Components não dá para gravar cookie; o proxy.ts cuida da renovação */
        }
      },
    },
  });
}
