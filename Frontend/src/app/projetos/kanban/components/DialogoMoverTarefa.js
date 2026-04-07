'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../../../../ui/base/button';
import { Label } from '../../../../ui/form/label';
import { cn } from '../../../../ui/form/utils';

export default function DialogoMoverTarefa({ open, onOpenChange, tarefa, etapaDestino, colaboradores, onConfirmar, isMovendo }) {
  const [colaboradorId, setColaboradorId] = useState(null);

  const moverParaBacklog = etapaDestino?.id == null;

  useEffect(() => {
    if (open) {
      // Ao mover para o backlog, limpa o responsável automaticamente
      setColaboradorId(moverParaBacklog ? null : (tarefa?.colaboradorResponsavelId ?? null));
    }
  }, [open, tarefa, moverParaBacklog]);

  const handleConfirmar = () => {
    onConfirmar(colaboradorId);
  };

  if (!tarefa) return null;

  const nomeEtapaDestino = etapaDestino?.nome ?? 'Backlog';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
            Mover tarefa
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-5">
            Movendo <span className="font-medium text-gray-700">&ldquo;{tarefa.titulo}&rdquo;</span> para{' '}
            <span className="font-medium text-gray-700">{nomeEtapaDestino}</span>.
          </Dialog.Description>

          <div className="space-y-4">
            {moverParaBacklog ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                O responsável será removido automaticamente ao retornar para o Backlog.
              </p>
            ) : (
              <div>
                <Label className="mb-1.5 block">Responsável</Label>
                <select
                  value={colaboradorId ?? ''}
                  onChange={(e) => setColaboradorId(e.target.value ? Number(e.target.value) : null)}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent'
                  )}
                >
                  <option value="">Sem responsável</option>
                  {colaboradores.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.nome}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Atual: {tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" tabIndex={-1} onClick={() => onOpenChange(false)} disabled={isMovendo}>
              Cancelar
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-blue-dark"
              onClick={handleConfirmar}
              disabled={isMovendo}
            >
              {isMovendo ? 'Movendo...' : 'Confirmar'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
