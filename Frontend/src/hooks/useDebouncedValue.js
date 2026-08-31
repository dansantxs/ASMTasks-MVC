'use client';

import { useEffect, useState } from 'react';

// Atrasa a propagação de um valor que muda rápido (ex.: filtros digitados) até ele parar de
// mudar por `delay` ms — evita disparar uma busca a cada tecla digitada.
export function useDebouncedValue(value, delay = 400) {
  const [valorAtrasado, setValorAtrasado] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setValorAtrasado(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return valorAtrasado;
}
