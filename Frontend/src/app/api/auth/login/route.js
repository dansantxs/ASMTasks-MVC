import { NextResponse } from 'next/server';

const BACKEND_URL = 'http://backend:8080/api/auth/login';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: 'Payload inválido.' }, { status: 400 });
  }

  let backendRes;
  try {
    backendRes = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ erro: 'Erro ao conectar ao servidor.' }, { status: 502 });
  }

  let data;
  try {
    data = await backendRes.json();
  } catch {
    data = null;
  }

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const setCookieHeader = backendRes.headers.get('set-cookie');
  const tokenMatch = setCookieHeader?.match(/asm_jwt=([^;]+)/);
  const token = tokenMatch?.[1];

  const response = NextResponse.json(data);

  if (token) {
    const isHttps = request.headers.get('x-forwarded-proto') === 'https';
    const expiresMatch = setCookieHeader?.match(/[Ee]xpires=([^;]+)/);
    const expires = expiresMatch ? new Date(expiresMatch[1]) : undefined;
    const validExpires = expires && !isNaN(expires.getTime()) ? expires : undefined;

    response.cookies.set('asm_jwt', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'strict',
      path: '/',
      ...(validExpires ? { expires: validExpires } : { maxAge: 60 * 60 * 2 }),
    });
  }

  return response;
}
