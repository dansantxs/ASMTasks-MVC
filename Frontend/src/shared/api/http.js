'use client';

import { getToken, clearSession } from '../auth/session';

export const API_BASE_URL = 'https://localhost:7199/api';

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers ?? {}) };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  return response;
}
