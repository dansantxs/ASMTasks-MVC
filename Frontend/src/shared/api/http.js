'use client';

import { limparSessao } from '../auth/session';

export const URL_BASE_API = 'https://localhost:7199/api';

export async function requisicaoApi(caminho, opcoes = {}) {
  const cabecalhos = { ...(opcoes.headers ?? {}) };

  const resposta = await fetch(`${URL_BASE_API}${caminho}`, {
    ...opcoes,
    headers: cabecalhos,
    credentials: 'include',
  });

  if (resposta.status === 401) {
    limparSessao();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      fetch(`${URL_BASE_API}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
      window.location.href = '/login';
    }
  }

  return resposta;
}
