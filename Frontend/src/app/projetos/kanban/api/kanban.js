'use client';

import { requisicaoApi } from '../../../../shared/api/http';

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

export async function getTarefasKanban({ colaboradorIds = [], projetoIds = [], clienteIds = [] } = {}) {
  const params = new URLSearchParams();
  colaboradorIds.forEach((id) => params.append('colaboradorIds', id));
  projetoIds.forEach((id) => params.append('projetoIds', id));
  clienteIds.forEach((id) => params.append('clienteIds', id));

  const query = params.toString();
  const res = await requisicaoApi(`/projetos/kanban${query ? `?${query}` : ''}`, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function moverTarefaEtapa(tarefaId, etapaId, colaboradorResponsavelId) {
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/etapa`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ etapaId: etapaId ?? null, colaboradorResponsavelId: colaboradorResponsavelId ?? null }),
  });
  return handleResponse(res);
}

export async function reordenarEtapas(itens) {
  const res = await requisicaoApi('/etapas/reordenar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itens),
  });
  return handleResponse(res);
}

export async function getEtapasKanban() {
  const res = await requisicaoApi('/etapas', { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getColaboradoresKanban() {
  const res = await requisicaoApi('/colaboradores', { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getProjetosKanban() {
  const res = await requisicaoApi('/projetos', { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getClientesKanban() {
  const res = await requisicaoApi('/clientes', { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function iniciarTarefa(tarefaId) {
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/iniciar`, {
    method: 'POST',
  });
  return handleResponse(res);
}

export async function pausarTarefa(tarefaId, observacao) {
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/pausar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ observacao: observacao || null }),
  });
  return handleResponse(res);
}

export async function trocarColaboradorTarefa(tarefaId, colaboradorResponsavelId) {
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/colaborador`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ colaboradorResponsavelId: colaboradorResponsavelId ?? null }),
  });
  return handleResponse(res);
}

export async function getHistoricoTarefa(tarefaId) {
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/historico`, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getHistoricoProjeto(projetoId) {
  const res = await requisicaoApi(`/projetos/${projetoId}/historico`, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function getAnexosTarefa(tarefaId) {
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/anexos`, { cache: 'no-store' });
  const data = await handleResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function uploadAnexoTarefa(tarefaId, arquivo) {
  const formData = new FormData();
  formData.append('arquivo', arquivo);
  const res = await requisicaoApi(`/projetos/tarefas/${tarefaId}/anexos`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function deletarAnexoTarefa(anexoId) {
  const res = await requisicaoApi(`/projetos/tarefas/anexos/${anexoId}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}

export async function fetchAnexoComoBlob(anexoId) {
  const res = await requisicaoApi(`/projetos/tarefas/anexos/${anexoId}/arquivo`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Erro ao carregar imagem.');
  return res.blob();
}
