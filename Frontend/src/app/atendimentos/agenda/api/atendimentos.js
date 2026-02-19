const API_BASE_URL = "https://localhost:7199/api";
const ATENDIMENTOS_API_URL = `${API_BASE_URL}/atendimentos`;
const CLIENTES_API_URL = `${API_BASE_URL}/clientes`;
const COLABORADORES_API_URL = `${API_BASE_URL}/colaboradores`;

async function handleResponse(res) {
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    let msg = "Erro inesperado.";
    if (data) {
      if (data.erro) msg = data.erro;
      else if (data.message) msg = data.message;
      else if (data.errors) {
        const flat = Object.values(data.errors).flat();
        if (flat.length) msg = flat.join("\n");
      }
      if (data.detalhe && data.detalhe !== msg) {
        msg += `\nDetalhe: ${data.detalhe}`;
      }
    } else {
      msg = `${res.status} ${res.statusText}`;
    }
    const error = new Error(msg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (res.status === 204 || !data) return null;
  return data;
}

export async function getAtendimentos(dataInicio, dataFim) {
  const params = new URLSearchParams();
  if (dataInicio) params.set("dataInicio", dataInicio);
  if (dataFim) params.set("dataFim", dataFim);

  const query = params.toString();
  const res = await fetch(
    query ? `${ATENDIMENTOS_API_URL}?${query}` : ATENDIMENTOS_API_URL,
    { cache: "no-store" }
  );
  const data = await handleResponse(res);
  return data ?? [];
}

export async function criarAtendimento(payload) {
  const res = await fetch(ATENDIMENTOS_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function atualizarAtendimento(id, payload) {
  const res = await fetch(`${ATENDIMENTOS_API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return handleResponse(res);
}

export async function marcarAtendimentoComoRealizado(id) {
  const res = await fetch(`${ATENDIMENTOS_API_URL}/${id}/realizar`, {
    method: "PUT",
  });

  return handleResponse(res);
}

export async function marcarAtendimentoComoAgendado(id) {
  const res = await fetch(`${ATENDIMENTOS_API_URL}/${id}/agendar`, {
    method: "PUT",
  });

  return handleResponse(res);
}

export async function inativarAtendimento(id) {
  const res = await fetch(`${ATENDIMENTOS_API_URL}/${id}`, {
    method: "DELETE",
  });

  return handleResponse(res);
}

export async function getClientes() {
  const res = await fetch(CLIENTES_API_URL, { cache: "no-store" });
  const data = await handleResponse(res);
  return data ?? [];
}

export async function getColaboradores() {
  const res = await fetch(COLABORADORES_API_URL, { cache: "no-store" });
  const data = await handleResponse(res);
  return data ?? [];
}
