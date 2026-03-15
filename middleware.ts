import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth for the login page itself to avoid redirect loop
  if (pathname === '/dashboard/login') return NextResponse.next();

  // Paths to protect — dashboard pages and admin API (except login)
  const isAdminPath = pathname.startsWith('/dashboard');
  const isAdminApi  = pathname.startsWith('/api/admin') && !pathname.endsWith('/login');

  if (isAdminPath || isAdminApi) {
    const sessionToken = request.cookies.get('admin_session')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // If ADMIN_PASSWORD is not set in env, allow access (dev mode safety)
    if (adminPassword && sessionToken !== adminPassword) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Redirect to dashboard login page
      const loginUrl = new URL('/dashboard/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/admin/:path*',
  ],
};
