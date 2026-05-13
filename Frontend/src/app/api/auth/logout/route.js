import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://backend:8080/api/auth/logout';

export async function POST(request) {
  try {
    await fetch(BACKEND_URL, { method: 'POST' });
  } catch {}

  const isHttps = request.headers.get('x-forwarded-proto') === 'https';
  const response = new NextResponse(null, { status: 204 });

  response.cookies.set('asm_jwt', '', {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
