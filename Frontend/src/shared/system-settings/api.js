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
  smtpServidor: '',
  smtpPorta: '',
  smtpUsuario: '',
  smtpSenha: '',
  smtpUsarSslTls: true,
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
    smtpServidor: merged.smtpServidor || '',
    smtpPorta:
      merged.smtpPorta === null || merged.smtpPorta === undefined || merged.smtpPorta === ''
        ? ''
        : String(merged.smtpPorta),
    smtpUsuario: merged.smtpUsuario || '',
    smtpSenha: merged.smtpSenha || '',
    smtpUsarSslTls: merged.smtpUsarSslTls ?? true,
  };
}

export async function getSystemSettings() {
  const data = await handleResponse(await apiFetch('/ConfiguracoesSistema', { cache: 'no-store' }));
  return normalizeSettings(data);
}

export async function updateSystemSettings(payload) {
  const smtpPortaNormalizada =
    payload?.smtpPorta === '' || payload?.smtpPorta === null || payload?.smtpPorta === undefined
      ? null
      : Number(payload.smtpPorta);

  const requestPayload = {
    ...payload,
    smtpPorta: Number.isFinite(smtpPortaNormalizada) ? smtpPortaNormalizada : null,
    smtpUsarSslTls: Boolean(payload?.smtpUsarSslTls),
  };

  const data = await handleResponse(await apiFetch('/ConfiguracoesSistema', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload),
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
