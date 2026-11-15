/* Proxy (antigo "middleware"): renova o login e manda para /painel/login quem não está logado. */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        lista.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await sb.auth.getUser();
  const caminho = req.nextUrl.pathname;
  if (!user && caminho !== "/painel/login") return NextResponse.redirect(new URL("/painel/login", req.url));
  if (user && caminho === "/painel/login") return NextResponse.redirect(new URL("/painel", req.url));
  return res;
}

export const config = { matcher: ["/painel/:path*"] };
