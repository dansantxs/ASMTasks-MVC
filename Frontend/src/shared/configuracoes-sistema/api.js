'use client';

import { useQuery } from '@tanstack/react-query';
import { requisicaoApi } from '../api/http';

export const configuracoesPadrao = {
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

async function tratarResposta(res) {
  const texto = await res.text();
  let dados = null;

  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {}

  if (!res.ok) {
    const msg = dados?.erro ?? dados?.message ?? `${res.status} ${res.statusText}`;
    const erro = new Error(msg);
    erro.status = res.status;
    erro.data = dados;
    throw erro;
  }

  return dados ?? configuracoesPadrao;
}

function normalizarConfiguracoes(dados) {
  const mesclado = {
    ...configuracoesPadrao,
    ...(dados ?? {}),
  };

  return {
    horaInicioAgenda: mesclado.horaInicioAgenda || configuracoesPadrao.horaInicioAgenda,
    horaFimAgenda: mesclado.horaFimAgenda || configuracoesPadrao.horaFimAgenda,
    logoBase64: mesclado.logoBase64 || null,
    email: mesclado.email || '',
    telefone: mesclado.telefone || '',
    razaoSocial: mesclado.razaoSocial || '',
    nomeFantasia: mesclado.nomeFantasia || '',
    cnpj: mesclado.cnpj || '',
    inscricaoEstadual: mesclado.inscricaoEstadual || '',
    cep: mesclado.cep || '',
    logradouro: mesclado.logradouro || '',
    numero: mesclado.numero || '',
    bairro: mesclado.bairro || '',
    cidade: mesclado.cidade || '',
    uf: mesclado.uf || '',
    smtpServidor: mesclado.smtpServidor || '',
    smtpPorta:
      mesclado.smtpPorta === null || mesclado.smtpPorta === undefined || mesclado.smtpPorta === ''
        ? ''
        : String(mesclado.smtpPorta),
    smtpUsuario: mesclado.smtpUsuario || '',
    smtpSenha: mesclado.smtpSenha || '',
    smtpUsarSslTls: mesclado.smtpUsarSslTls ?? true,
  };
}

export async function buscarConfiguracoesSistema() {
  const dados = await tratarResposta(await requisicaoApi('/ConfiguracoesSistema', { cache: 'no-store' }));
  return normalizarConfiguracoes(dados);
}

export async function atualizarConfiguracoesSistema(payload) {
  const smtpPortaNormalizada =
    payload?.smtpPorta === '' || payload?.smtpPorta === null || payload?.smtpPorta === undefined
      ? null
      : Number(payload.smtpPorta);

  const dadosRequisicao = {
    ...payload,
    smtpPorta: Number.isFinite(smtpPortaNormalizada) ? smtpPortaNormalizada : null,
    smtpUsarSslTls: Boolean(payload?.smtpUsarSslTls),
  };

  const dados = await tratarResposta(await requisicaoApi('/ConfiguracoesSistema', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dadosRequisicao),
  }));
  return normalizarConfiguracoes(dados);
}

export function useConfiguracoesSistema() {
  return useQuery({
    queryKey: ['configuracoes-sistema'],
    queryFn: buscarConfiguracoesSistema,
    staleTime: 5 * 60 * 1000,
  });
}
