'use client';

import { requisicaoApi } from '../../../shared/api/http';

async function tratarResposta(res) {
  const texto = await res.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {}

  if (!res.ok) {
    let msg = 'Erro inesperado.';
    if (dados?.erro) msg = dados.erro;
    else if (dados?.message) msg = dados.message;
    else msg = `${res.status} ${res.statusText}`;
    const erro = new Error(msg);
    erro.status = res.status;
    throw erro;
  }

  return dados;
}

export async function login(payload) {
  const res = await requisicaoApi('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return tratarResposta(res);
}

export async function alterarSenha(payload) {
  const res = await requisicaoApi('/auth/alterar-senha', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await tratarResposta(res);
}

export async function alterarLogin(payload) {
  const res = await requisicaoApi('/auth/alterar-login', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await tratarResposta(res);
}

export async function obterUsuarioLogado() {
  const res = await requisicaoApi('/auth/me', { cache: 'no-store' });
  return tratarResposta(res);
}
