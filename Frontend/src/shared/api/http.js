'use client';

import { obterToken, limparSessao } from '../auth/session';

export const URL_BASE_API = 'https://localhost:7199/api';

export async function requisicaoApi(caminho, opcoes = {}) {
  const token = obterToken();
  const cabecalhos = { ...(opcoes.headers ?? {}) };

  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  const resposta = await fetch(`${URL_BASE_API}${caminho}`, {
    ...opcoes,
    headers: cabecalhos,
  });

  if (resposta.status === 401) {
    limparSessao();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return resposta;
}
