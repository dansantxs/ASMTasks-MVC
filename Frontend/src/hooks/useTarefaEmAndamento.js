'use client';

import { useQuery } from '@tanstack/react-query';
import { getMinhaTarefaEmAndamento } from '../app/projetos/kanban/api/kanban';

export function useTarefaEmAndamento({ enabled = true } = {}) {
  const { data } = useQuery({
    queryKey: ['tarefa-em-andamento'],
    queryFn: getMinhaTarefaEmAndamento,
    enabled,
    refetchInterval: 20000,
    staleTime: 10000,
    retry: false,
  });

  return { tarefa: data ?? null };
}
