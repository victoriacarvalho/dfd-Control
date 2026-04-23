import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const url = request.nextUrl.clone();

  // Se acessar a raiz "/", manda para o Lobby de Processos
  if (url.pathname === "/") {
    url.pathname = "/processos";
    return NextResponse.redirect(url);
  }

  // Se NÃO tem token e tenta acessar rotas protegidas
  if (
    !token &&
    !url.pathname.startsWith("/login") &&
    !url.pathname.startsWith("/cadastro")
  ) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Se TEM token e tenta acessar tela de login/cadastro
  if (
    token &&
    (url.pathname.startsWith("/login") || url.pathname.startsWith("/cadastro"))
  ) {
    url.pathname = "/processos"; // <--- ATUALIZADO AQUI
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
