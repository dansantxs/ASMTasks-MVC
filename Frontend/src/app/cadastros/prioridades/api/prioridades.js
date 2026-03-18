import { requisicaoApi } from '../../../../shared/api/http';

async function tratarResposta(res) {
  const texto = await res.text();
  let dados = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {}

  if (!res.ok) {
    let msg = "Erro inesperado.";
    if (dados) {
      if (dados.erro) msg = dados.erro;
      else if (dados.message) msg = dados.message;
      else if (dados.errors) {
        const linhas = Object.values(dados.errors).flat();
        if (linhas.length) msg = linhas.join("\n");
      }
      if (dados.detalhe && dados.detalhe !== msg) {
        msg += `\nDetalhe: ${dados.detalhe}`;
      }
    } else {
      msg = `${res.status} ${res.statusText}`;
    }
    const erro = new Error(msg);
    erro.status = res.status;
    erro.data = dados;
    throw erro;
  }

  if (res.status === 204) return null;
  return dados;
}

export async function getPrioridades() {
  const res = await requisicaoApi('/prioridades', { cache: "no-store" });
  const dados = await tratarResposta(res);
  return Array.isArray(dados) ? dados : [];
}

export async function getPrioridadeById(id) {
  const res = await requisicaoApi(`/prioridades/${id}`, { cache: "no-store" });
  return tratarResposta(res);
}

export async function criarPrioridade(dados) {
  const res = await requisicaoApi('/prioridades', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function atualizarPrioridade(id, dados) {
  const res = await requisicaoApi(`/prioridades/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function inativarPrioridade(id) {
  const res = await requisicaoApi(`/prioridades/${id}`, { method: "DELETE" });
  return tratarResposta(res);
}

export async function reativarPrioridade(id) {
  const res = await requisicaoApi(`/prioridades/${id}/reativar`, { method: "PUT" });
  return tratarResposta(res);
}
