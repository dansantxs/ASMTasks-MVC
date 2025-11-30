const API_URL = "https://localhost:7199/api/setores";

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

export async function getSetores() {
    const res = await fetch(API_URL, { cache: "no-store" });
    return handleResponse(res);
}

export async function getSetorById(id) {
    const res = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
    return handleResponse(res);
}

export async function criarSetor(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function atualizarSetor(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function inativarSetor(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    return handleResponse(res);
}

export async function reativarSetor(id) {
    const res = await fetch(`${API_URL}/${id}/reativar`, { method: "PUT" });
    return handleResponse(res);
}