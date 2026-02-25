'use client';

const STORAGE_KEY = 'asm_auth_session';
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(loginResponse) {
  if (typeof window === 'undefined') return;

  const payload = decodeJwtPayload(loginResponse.token) ?? {};
  const session = {
    token: loginResponse.token,
    expiraEm: loginResponse.expiraEm,
    usuarioId: loginResponse.usuarioId,
    colaboradorId: Number(loginResponse.colaboradorId ?? payload.colaboradorId),
    colaboradorNome: loginResponse.colaboradorNome ?? payload.colaboradorNome ?? '',
    nivelAcesso: loginResponse.nivelAcesso ?? payload.nivelAcesso ?? 'PADRAO',
    ultimoAcessoEm: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function getToken() {
  const session = getStoredSession();
  if (!session?.token) return null;
  return session.token;
}

export function isSessionValid() {
  const session = getStoredSession();
  if (!session?.token || !session?.expiraEm) return false;

  const expiresAt = new Date(session.expiraEm).getTime();
  if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    clearSession();
    return false;
  }

  if (Date.now() - (session.ultimoAcessoEm ?? 0) > INACTIVITY_LIMIT_MS) {
    clearSession();
    return false;
  }

  return true;
}

export function touchSessionActivity() {
  const session = getStoredSession();
  if (!session) return;

  session.ultimoAcessoEm = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getInactivityLimitMs() {
  return INACTIVITY_LIMIT_MS;
}
