const API_URL = "https://localhost:7199/api/prioridades";

export async function getPrioridades() {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar prioridades");
    return res.json();
}

export async function getPrioridadeById(id) {
    const res = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar prioridade");
    return res.json();
}

export async function criarPrioridade(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar prioridade");
    return res.json();
}

export async function atualizarPrioridade(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar prioridade");
    return true;
}

export async function inativarPrioridade(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao inativar prioridade");
    return true;
}

export async function reativarPrioridade(id) {
    const res = await fetch(`${API_URL}/${id}/reativar`, { method: "PUT" });
    if (!res.ok) throw new Error("Erro ao reativar prioridade");
    return true;
}