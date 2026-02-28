import { NextResponse } from 'next/server';

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = url;
  // only protect paths under /(private). anything outside that (including
  // /(public) pages) is considered public and may be visited without a user
  // cookie. we explicitly allow login as well.
  if (!pathname.startsWith('/(private)')) {
    return NextResponse.next();
  }
  // allow login regardless
  if (pathname === '/login' || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get('user');
  if (!cookie) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
