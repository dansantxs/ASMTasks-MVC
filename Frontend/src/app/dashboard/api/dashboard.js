import { requisicaoApi } from '../../../shared/api/http';

export async function getDashboard(colaboradorId = null) {
  const params = colaboradorId ? `?colaboradorId=${colaboradorId}` : '';
  const resposta = await requisicaoApi(`/dashboard${params}`);
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.erro ?? 'Erro ao carregar dashboard.');
  }
  return resposta.json();
}
