'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../../../../components/ui/base/button';
import { Label } from '../../../../components/ui/form/label';
import { cn } from '../../../../components/ui/form/utils';

export default function DialogoMoverTarefa({ open, onOpenChange, tarefa, etapaDestino, colaboradores = [], onConfirmar, isMovendo }) {
  const [colaboradorId, setColaboradorId] = useState(null);
  const [mostrarTodosSetores, setMostrarTodosSetores] = useState(false);

  const moverParaBacklog = etapaDestino?.id == null;

  useEffect(() => {
    if (open) {
      setColaboradorId(moverParaBacklog ? null : (tarefa?.colaboradorResponsavelId ?? null));
      setMostrarTodosSetores(false);
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
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Responsável</Label>
                  {tarefa?.setorId && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={mostrarTodosSetores}
                        onChange={(e) => setMostrarTodosSetores(e.target.checked)}
                        className="rounded"
                      />
                      Mostrar todos os setores
                    </label>
                  )}
                </div>
                <select
                  value={colaboradorId ?? ''}
                  onChange={(e) => setColaboradorId(e.target.value ? Number(e.target.value) : null)}
                  className={cn(
                    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent'
                  )}
                >
                  <option value="">Sem responsável</option>
                  {tarefa?.setorId && !mostrarTodosSetores ? (
                    colaboradores
                      .filter((c) => c.setorId === tarefa.setorId)
                      .map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.nome}{col.cargoNome ? ` — ${col.cargoNome}` : ''}
                        </option>
                      ))
                  ) : tarefa?.setorId ? (() => {
                    const doSetor = colaboradores.filter((c) => c.setorId === tarefa.setorId);
                    const outrosSetores = colaboradores.filter((c) => c.setorId !== tarefa.setorId);
                    return (
                      <>
                        {doSetor.length > 0 && (
                          <optgroup label="Setor da tarefa">
                            {doSetor.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.nome}{col.cargoNome ? ` — ${col.cargoNome}` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {outrosSetores.length > 0 && (
                          <optgroup label="Outros setores">
                            {outrosSetores.map((col) => (
                              <option key={col.id} value={col.id}>
                                {col.nome}{col.cargoNome ? ` — ${col.cargoNome}` : ''}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })() : colaboradores.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.nome}{col.cargoNome ? ` — ${col.cargoNome}` : ''}
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
