'use client';

import { requisicaoApi } from '../../../shared/api/http';

const PROJETOS_API_URL = '/projetos';
const CLIENTES_API_URL = '/clientes';
const SETORES_API_URL = '/setores';
const PRIORIDADES_API_URL = '/prioridades';
const COLABORADORES_API_URL = '/colaboradores';
const ETAPAS_API_URL = '/etapas';

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    let msg = 'Erro inesperado.';
    if (data) {
      if (data.erro) msg = data.erro;
      else if (data.message) msg = data.message;
      else if (data.errors) {
        const flat = Object.values(data.errors).flat();
        if (flat.length) msg = flat.join('\n');
      }
      if (data.detalhe && data.detalhe !== msg) {
        msg += `\nDetalhe: ${data.detalhe}`;
      }
    } else {
      msg = `${res.status} ${res.statusText}`;
    }

    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (res.status === 204 || !data) return null;
  return data;
}

export async function getProjeto(id) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}`, { cache: 'no-store' });
  return handleResponse(res);
}

export async function getProjetos() {
  const res = await requisicaoApi(PROJETOS_API_URL, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function criarProjeto(payload) {
  const res = await requisicaoApi(PROJETOS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function atualizarProjeto(id, payload) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function inativarProjeto(id) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}`, { method: 'DELETE' });
  return handleResponse(res);
}

export async function reativarProjeto(id) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}/reativar`, { method: 'PUT' });
  return handleResponse(res);
}

export async function desmarcarConclusaoProjeto(id) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}/desmarcar-conclusao`, { method: 'PUT' });
  return handleResponse(res);
}

export async function duplicarProjeto(id, clienteIds) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}/duplicar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clienteIds }),
  });
  return handleResponse(res);
}

export async function getClientes() {
  const res = await requisicaoApi(CLIENTES_API_URL, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getSetores() {
  const res = await requisicaoApi(SETORES_API_URL, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getPrioridades() {
  const res = await requisicaoApi(PRIORIDADES_API_URL, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getColaboradores() {
  const res = await requisicaoApi(COLABORADORES_API_URL, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getEtapas() {
  const res = await requisicaoApi(ETAPAS_API_URL, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getProjetoDocumento(id) {
  const res = await requisicaoApi(`${PROJETOS_API_URL}/${id}/documento`, { cache: 'no-store' });
  return handleResponse(res);
}

export async function criarSetor(payload) {
  const res = await requisicaoApi(SETORES_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function criarCliente(payload) {
  const res = await requisicaoApi(CLIENTES_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function criarPrioridade(payload) {
  const res = await requisicaoApi(PRIORIDADES_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
