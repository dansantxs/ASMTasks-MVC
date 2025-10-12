const API_URL = "https://localhost:7199/api/setores";

export async function getSetores() {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar setores");
    return res.json();
}

export async function getSetorById(id) {
    const res = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar setor");
    return res.json();
}

export async function criarSetor(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar setor");
    return res.json();
}

export async function atualizarSetor(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar setor");
    return true;
}

export async function inativarSetor(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao inativar setor");
    return true;
}

export async function reativarSetor(id) {
    const res = await fetch(`${API_URL}/${id}/reativar`, { method: "PUT" });
    if (!res.ok) throw new Error("Erro ao reativar setor");
    return true;
}