'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Preferência de tela que fica guardada no navegador de quem usa — o modo de visualização de um
 * relatório, por exemplo. Cada pessoa mantém o seu, e a tela volta do jeito que ela deixou.
 *
 * A leitura só acontece depois da montagem porque no SSR do Next não existe localStorage; até lá
 * vale o padrão. Storage bloqueado (navegação anônima) ou valor corrompido não quebram nada: a
 * tela apenas deixa de lembrar.
 */
export function usePreferenciaLocal(chave, padrao) {
  const [valor, setValor] = useState(padrao);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chave);
      if (salvo) setValor(salvo);
    } catch {
      // segue com o padrão
    }
  }, [chave]);

  const definir = useCallback(
    (novo) => {
      setValor(novo);
      try {
        localStorage.setItem(chave, novo);
      } catch {
        // só não persiste
      }
    },
    [chave]
  );

  return [valor, definir];
}
