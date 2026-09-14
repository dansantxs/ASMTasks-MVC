import { NextResponse } from 'next/server';

export async function GET(_request, { params }) {
  const { cep } = await params;
  const apenasNumeros = cep.replace(/\D/g, '');

  if (apenasNumeros.length !== 8) {
    return NextResponse.json({ erro: 'CEP inválido.' }, { status: 400 });
  }

  let res;
  try {
    res = await fetch(`https://viacep.com.br/ws/${apenasNumeros}/json/`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch (err) {
    console.error(`Falha ao consultar o ViaCEP (${apenasNumeros}):`, err);
    return NextResponse.json({ erro: 'Erro ao consultar o ViaCEP.' }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ erro: 'Erro ao consultar o ViaCEP.' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
