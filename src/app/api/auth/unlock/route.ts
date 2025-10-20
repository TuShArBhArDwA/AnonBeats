import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PASS = process.env.GATE_PASSWORD || '2004';

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: '' }));
  if (password !== PASS) {
    return NextResponse.json({ ok: false, message: 'Wrong password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('ab_auth', 'yes', {
    httpOnly: false, // simple gate (not real auth)
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return res;
}