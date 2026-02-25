'use client';

import { apiFetch } from '../../../shared/api/http';

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    let msg = 'Erro inesperado.';
    if (data?.erro) msg = data.erro;
    else if (data?.message) msg = data.message;
    else msg = `${res.status} ${res.statusText}`;
    const error = new Error(msg);
    error.status = res.status;
    throw error;
  }

  return data;
}

export async function login(payload) {
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function alterarSenha(payload) {
  const res = await apiFetch('/auth/alterar-senha', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await handleResponse(res);
}

export async function alterarLogin(payload) {
  const res = await apiFetch('/auth/alterar-login', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await handleResponse(res);
}

export async function obterUsuarioLogado() {
  const res = await apiFetch('/auth/me', { cache: 'no-store' });
  return handleResponse(res);
}
