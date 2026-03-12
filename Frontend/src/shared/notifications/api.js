'use client';

import { apiFetch } from '../api/http';

const NOTIFICACOES_API_URL = '/Notificacoes';

const defaultNotificationListResponse = {
  quantidadeNaoLidas: 0,
  itens: [],
};

async function handleResponse(res) {
  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const message = data?.erro ?? data?.message ?? `${res.status} ${res.statusText}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (!data || res.status === 204) return null;
  return data;
}

function normalizeNotificationListResponse(data) {
  const merged = {
    ...defaultNotificationListResponse,
    ...(data ?? {}),
  };

  return {
    quantidadeNaoLidas: Number.isFinite(Number(merged.quantidadeNaoLidas))
      ? Number(merged.quantidadeNaoLidas)
      : 0,
    itens: Array.isArray(merged.itens) ? merged.itens : [],
  };
}

export async function getNotifications(limite = 50) {
  const params = new URLSearchParams();
  if (Number.isFinite(Number(limite)) && Number(limite) > 0) {
    params.set('limite', String(Math.trunc(Number(limite))));
  }

  const query = params.toString();
  const path = query ? `${NOTIFICACOES_API_URL}?${query}` : NOTIFICACOES_API_URL;
  const data = await handleResponse(await apiFetch(path, { cache: 'no-store' }));
  return normalizeNotificationListResponse(data);
}

export async function markNotificationAsRead(id) {
  const response = await apiFetch(`${NOTIFICACOES_API_URL}/${id}/lida`, {
    method: 'PUT',
  });

  await handleResponse(response);
}

export { defaultNotificationListResponse };
