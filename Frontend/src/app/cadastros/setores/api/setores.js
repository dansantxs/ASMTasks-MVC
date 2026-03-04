'use client';

import { apiFetch } from '../../../../shared/api/http';

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
    const res = await apiFetch('/setores', { cache: "no-store" });
    const data = await handleResponse(res);
    return Array.isArray(data) ? data : [];
}

export async function getSetorById(id) {
    const res = await apiFetch(`/setores/${id}`, { cache: "no-store" });
    return handleResponse(res);
}

export async function criarSetor(data) {
    const res = await apiFetch('/setores', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function atualizarSetor(id, data) {
    const res = await apiFetch(`/setores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function inativarSetor(id) {
    const res = await apiFetch(`/setores/${id}`, { method: "DELETE" });
    return handleResponse(res);
}

export async function reativarSetor(id) {
    const res = await apiFetch(`/setores/${id}/reativar`, { method: "PUT" });
    return handleResponse(res);
}
