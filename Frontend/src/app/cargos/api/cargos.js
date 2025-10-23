const API_URL = "https://localhost:7199/api/cargos";

export async function getCargos() {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar cargos");
    return res.json();
}

export async function getCargoById(id) {
    const res = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Erro ao buscar cargo");
    return res.json();
}

export async function criarCargo(data) {
    const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao criar cargo");
    return res.json();
}

export async function atualizarCargo(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Erro ao atualizar cargo");
    return true;
}

export async function inativarCargo(id) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao inativar cargo");
    return true;
}

export async function reativarCargo(id) {
    const res = await fetch(`${API_URL}/${id}/reativar`, { method: "PUT" });
    if (!res.ok) throw new Error("Erro ao reativar cargo");
    return true;
}