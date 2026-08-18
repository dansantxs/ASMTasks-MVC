'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Considera os dados "frescos" por 1 min: evita refetch imediato ao
            // remontar telas ou navegar de volta. Reduz muito o reprocessamento
            // de listas grandes (clientes com muitos lancamentos), especialmente
            // em navegadores/maquinas mais lentos (Chrome 109 / Windows 7).
            staleTime: 60_000,
            // Mantem o cache em memoria por 5 min apos a tela sair de uso.
            gcTime: 5 * 60_000,
            // Nao refazer requisicao so por focar a janela.
            refetchOnWindowFocus: false,
            // Nao refazer ao reconectar automaticamente.
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
