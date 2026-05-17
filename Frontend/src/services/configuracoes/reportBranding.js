'use client';

import { obterLinhasRodapeEmpresa } from './utils';

export async function obterLogotipo(configuracoes) {
  return configuracoes?.logoDocumentosBase64 || configuracoes?.logoBase64 || null;
}

export function obterRodapeRelatorio(configuracoes) {
  return obterLinhasRodapeEmpresa(configuracoes);
}
