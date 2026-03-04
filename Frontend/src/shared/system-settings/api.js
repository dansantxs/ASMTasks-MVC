'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../api/http';

export const defaultSystemSettings = {
  horaInicioAgenda: '08:00',
  horaFimAgenda: '18:00',
  logoBase64: null,
  email: '',
  telefone: '',
  razaoSocial: '',
  nomeFantasia: '',
  cnpj: '',
  inscricaoEstadual: '',
  cep: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cidade: '',
  uf: '',
};

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

  return data ?? defaultSystemSettings;
}

function normalizeSettings(data) {
  const merged = {
    ...defaultSystemSettings,
    ...(data ?? {}),
  };

  return {
    horaInicioAgenda: merged.horaInicioAgenda || defaultSystemSettings.horaInicioAgenda,
    horaFimAgenda: merged.horaFimAgenda || defaultSystemSettings.horaFimAgenda,
    logoBase64: merged.logoBase64 || null,
    email: merged.email || '',
    telefone: merged.telefone || '',
    razaoSocial: merged.razaoSocial || '',
    nomeFantasia: merged.nomeFantasia || '',
    cnpj: merged.cnpj || '',
    inscricaoEstadual: merged.inscricaoEstadual || '',
    cep: merged.cep || '',
    logradouro: merged.logradouro || '',
    numero: merged.numero || '',
    bairro: merged.bairro || '',
    cidade: merged.cidade || '',
    uf: merged.uf || '',
  };
}

export async function getSystemSettings() {
  const data = await handleResponse(await apiFetch('/ConfiguracoesSistema', { cache: 'no-store' }));
  return normalizeSettings(data);
}

export async function updateSystemSettings(payload) {
  const data = await handleResponse(await apiFetch('/ConfiguracoesSistema', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }));
  return normalizeSettings(data);
}

export function useSystemSettingsQuery() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
    staleTime: 5 * 60 * 1000,
  });
}
