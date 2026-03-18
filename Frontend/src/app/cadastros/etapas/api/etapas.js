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

export async function getEtapas() {
  const res = await requisicaoApi('/etapas', { cache: "no-store" });
  const dados = await tratarResposta(res);
  return Array.isArray(dados) ? dados : [];
}

export async function getEtapaById(id) {
  const res = await requisicaoApi(`/etapas/${id}`, { cache: "no-store" });
  return tratarResposta(res);
}

export async function criarEtapa(dados) {
  const res = await requisicaoApi('/etapas', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function atualizarEtapa(id, dados) {
  const res = await requisicaoApi(`/etapas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return tratarResposta(res);
}

export async function inativarEtapa(id) {
  const res = await requisicaoApi(`/etapas/${id}`, { method: "DELETE" });
  return tratarResposta(res);
}

export async function reativarEtapa(id) {
  const res = await requisicaoApi(`/etapas/${id}/reativar`, { method: "PUT" });
  return tratarResposta(res);
}
