import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml|json|mp3|mp4|wav)$/i;

// allow assets + welcome + unlock/logout
const ALLOW_PREFIX = [
  '/welcome',
  '/api/auth/unlock',
  '/api/auth/logout',
  '/_next',     // framework assets
  '/favicon', '/icon', '/apple-touch-icon', // icons
  '/logo', '/lines' 
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_FILE.test(pathname) || ALLOW_PREFIX.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const unlocked = req.cookies.get('ab_auth')?.value === 'yes';
  if (!unlocked) {
    const url = req.nextUrl.clone();
    url.pathname = '/welcome';
    url.searchParams.set('continue', pathname); // remember target
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};