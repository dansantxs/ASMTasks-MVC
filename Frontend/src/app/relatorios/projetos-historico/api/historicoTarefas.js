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
      if (data.detalhe && data.detalhe !== msg) msg += `\nDetalhe: ${data.detalhe}`;
    } else {
      msg = `${res.status} ${res.statusText}`;
    }
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (res.status === 204 || !data) return [];
  return Array.isArray(data) ? data : [];
}

export async function getHistoricoTarefas(params = {}) {
  const query = new URLSearchParams();

  if (params.tipo && params.tipo !== 'todos') query.set('tipo', params.tipo);
  if (params.colaboradorId && params.colaboradorId !== 'todos') query.set('colaboradorId', params.colaboradorId);
  if (params.projetoId && params.projetoId !== 'todos') query.set('projetoId', params.projetoId);
  if (params.clienteId && params.clienteId !== 'todos') query.set('clienteId', params.clienteId);
  if (params.dataInicio) query.set('dataInicio', params.dataInicio);
  if (params.dataFim) query.set('dataFim', params.dataFim);

  const suffix = query.toString();
  const url = suffix
    ? `/projetos/tarefas/relatorio-historico?${suffix}`
    : '/projetos/tarefas/relatorio-historico';
  const res = await requisicaoApi(url, { cache: 'no-store' });
  return handleResponse(res);
}
