import { requisicaoApi } from '../../../api/http';

export async function getDashboard(colaboradorId = null, periodo = 'mesAtual', ordem = 'etapa') {
  const params = new URLSearchParams();
  if (colaboradorId) params.set('colaboradorId', String(colaboradorId));
  if (periodo) params.set('periodo', periodo);
  if (ordem) params.set('ordem', ordem);
  const query = params.toString();
  const resposta = await requisicaoApi(`/dashboard${query ? `?${query}` : ''}`);
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro ?? 'Erro ao carregar dashboard.');
  }
  return resposta.json();
}
