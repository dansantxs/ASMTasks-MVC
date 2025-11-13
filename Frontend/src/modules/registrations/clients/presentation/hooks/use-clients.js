'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClient,
  deactivateClient,
  loadClients,
  reactivateClient,
  updateClient,
} from '../../application/services/client-service';
import { buildClientViewModel } from '../view-models/client-view-model';

export function useClients() {
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const entities = await loadClients();
      return entities.map(buildClientViewModel);
    },
  });

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => deactivateClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => reactivateClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  return {
    clients: clientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading,
    createClient: (data) => createMutation.mutateAsync(data),
    updateClient: (id, data) => updateMutation.mutateAsync({ id, data }),
    deactivateClient: (id) => deactivateMutation.mutateAsync(id),
    reactivateClient: (id) => reactivateMutation.mutateAsync(id),
    status: {
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeactivating: deactivateMutation.isPending,
      isReactivating: reactivateMutation.isPending,
    },
    error: clientsQuery.error,
  };
}
