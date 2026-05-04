'use client';

import { useQuery } from '@tanstack/react-query';
import { requisicaoApi } from '../api/http';

export function useUsuarioAtual({ enabled = true } = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ['usuario-atual'],
    queryFn: async () => {
      const resp = await requisicaoApi('/auth/me');
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return { usuario: data ?? null, carregando: isLoading };
}
