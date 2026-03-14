import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths to protect
  const isAdminPath = pathname.startsWith('/dashboard');
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.endsWith('/login');

  if (isAdminPath || isAdminApi) {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken || sessionToken !== process.env.ADMIN_PASSWORD) {
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
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
