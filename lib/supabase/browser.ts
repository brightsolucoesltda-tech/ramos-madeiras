/* Cliente do Supabase para o navegador (usado só no login). */
import { createBrowserClient } from "@supabase/ssr";

export const supabaseNavegador = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
