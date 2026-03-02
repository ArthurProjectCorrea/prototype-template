import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Routes públicas (sem autenticação necessária)
  const publicRoutes = ['/login', '/api/auth', '/_next', '/favicon.ico'];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Se for rota pública, deixa passar
  if (isPublicRoute) {
    return res;
  }

  // Criar cliente Supabase para validar sessão
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set(name, value, options);
        },
        remove(name, options) {
          res.cookies.delete(name);
        },
      },
    }
  );

  // Validar sessão do usuário
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não houver usuário autenticado, redireciona para login
  if (!user) {
    // Evita redirecionar para login se já estiver em login
    if (pathname === '/login') {
      return res;
    }

    const loginUrl = new URL('/login', req.url);

    // Preserva a rota original para redirecionamento após login
    // Não adiciona redirect se já estiver em uma página de login
    if (pathname && pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }

    return NextResponse.redirect(loginUrl);
  }

  return res;
}

// Exportar também como proxy para compatibilidade
export async function proxy(req) {
  return middleware(req);
}

export const config = {
  matcher: [
    // Proteger todas as rotas exceto as públicas listadas
    '/((?!login|_next|api/auth|favicon\\.ico).*)',
  ],
};
