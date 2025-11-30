const API_URL = "https://localhost:7199/api/etapas";

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

    if (res.status === 204) return null;
    return data;
}

export async function getEtapas() {
    const res = await fetch(API_URL, { cache: "no-store" });
    return handleResponse(res);
}

export async function getEtapaById(id) {
    const res = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
    return handleResponse(res);
}

export async function criarEtapa(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function atualizarEtapa(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function inativarEtapa(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    return handleResponse(res);
}

export async function reativarEtapa(id) {
    const res = await fetch(`${API_URL}/${id}/reativar`, { method: "PUT" });
    return handleResponse(res);
}