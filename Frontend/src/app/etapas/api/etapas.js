const API_URL = "https://localhost:7199/api/etapas";

export async function getEtapas() {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar etapas");
    return res.json();
}

export async function getEtapaById(id) {
    const res = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar etapa");
    return res.json();
}

export async function criarEtapa(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar etapa");
    return res.json();
}

export async function atualizarEtapa(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar etapa");
    return true;
}

export async function inativarEtapa(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao inativar etapa");
    return true;
}

export async function reativarEtapa(id) {
    const res = await fetch(`${API_URL}/${id}/reativar`, { method: "PUT" });
    if (!res.ok) throw new Error("Erro ao reativar etapa");
    return true;
}