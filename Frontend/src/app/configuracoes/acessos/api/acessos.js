'use client';

import { apiFetch } from '../../../../shared/api/http';

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const msg = data?.erro ?? data?.message ?? `${res.status} ${res.statusText}`;
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (res.status === 204) return null;
  return data;
}

export async function getPermissoesDisponiveis() {
  return handleResponse(await apiFetch('/acessos/permissoes-disponiveis', { cache: 'no-store' }));
}

export async function getNiveisAcesso() {
  return handleResponse(await apiFetch('/acessos/niveis', { cache: 'no-store' }));
}

export async function criarNivelAcesso(payload) {
  return handleResponse(await apiFetch('/acessos/niveis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}

export async function atualizarNivelAcesso(id, payload) {
  return handleResponse(await apiFetch(`/acessos/niveis/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}

export async function inativarNivelAcesso(id) {
  return handleResponse(await apiFetch(`/acessos/niveis/${id}`, { method: 'DELETE' }));
}

export async function reativarNivelAcesso(id) {
  return handleResponse(await apiFetch(`/acessos/niveis/${id}/reativar`, { method: 'PUT' }));
}

export async function getUsuariosAcesso() {
  return handleResponse(await apiFetch('/acessos/usuarios', { cache: 'no-store' }));
}

export async function atualizarNivelUsuario(id, payload) {
  return handleResponse(await apiFetch(`/acessos/usuarios/${id}/nivel`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}

export async function inativarUsuario(id) {
  return handleResponse(await apiFetch(`/acessos/usuarios/${id}`, { method: 'DELETE' }));
}

export async function reativarUsuario(id) {
  return handleResponse(await apiFetch(`/acessos/usuarios/${id}/reativar`, { method: 'PUT' }));
}

export async function atualizarUsuarioAcesso(id, payload) {
  return handleResponse(await apiFetch(`/acessos/usuarios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
}
