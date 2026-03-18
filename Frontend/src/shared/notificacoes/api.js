'use client';

import { requisicaoApi } from '../api/http';

const URL_NOTIFICACOES = '/Notificacoes';

export const respostaPadraoNotificacoes = {
  quantidadeNaoLidas: 0,
  itens: [],
};

async function tratarResposta(res) {
  const texto = await res.text();
  let dados = null;

  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {}

  if (!res.ok) {
    const mensagem = dados?.erro ?? dados?.message ?? `${res.status} ${res.statusText}`;
    const erro = new Error(mensagem);
    erro.status = res.status;
    erro.data = dados;
    throw erro;
  }

  if (!dados || res.status === 204) return null;
  return dados;
}

function normalizarRespostaNotificacoes(dados) {
  const mesclado = {
    ...respostaPadraoNotificacoes,
    ...(dados ?? {}),
  };

  return {
    quantidadeNaoLidas: Number.isFinite(Number(mesclado.quantidadeNaoLidas))
      ? Number(mesclado.quantidadeNaoLidas)
      : 0,
    itens: Array.isArray(mesclado.itens) ? mesclado.itens : [],
  };
}

export async function buscarNotificacoes(limite = 50) {
  const params = new URLSearchParams();
  if (Number.isFinite(Number(limite)) && Number(limite) > 0) {
    params.set('limite', String(Math.trunc(Number(limite))));
  }

  const query = params.toString();
  const caminho = query ? `${URL_NOTIFICACOES}?${query}` : URL_NOTIFICACOES;
  const dados = await tratarResposta(await requisicaoApi(caminho, { cache: 'no-store' }));
  return normalizarRespostaNotificacoes(dados);
}

export async function marcarNotificacaoLida(id) {
  const resposta = await requisicaoApi(`${URL_NOTIFICACOES}/${id}/lida`, {
    method: 'PUT',
  });

  await tratarResposta(resposta);
}
