'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X, Folder, Building2, User, Tag } from 'lucide-react';
import { Button } from '../../../../ui/base/button';

export default function DialogoVisualizarTarefa({ open, onOpenChange, tarefa }) {
  if (!tarefa) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-lg">
          <div
            className="h-1.5 rounded-t-xl"
            style={{ backgroundColor: tarefa.prioridadeCor ?? '#e5e7eb' }}
          />
          <div className="p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <Dialog.Title className="text-base font-semibold text-gray-900 leading-snug">
                {tarefa.titulo}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {tarefa.descricao && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Descrição</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{tarefa.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Prioridade</p>
                    {tarefa.prioridadeNome ? (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: tarefa.prioridadeCor ?? '#6b7280' }}
                      >
                        {tarefa.prioridadeNome}
                      </span>
                    ) : (
                      <p className="text-sm text-gray-600">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Responsável</p>
                    <p className="text-sm text-gray-700">{tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Projeto</p>
                    <p className="text-sm text-gray-700">{tarefa.projetoTitulo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="text-sm text-gray-700">{tarefa.clienteNome}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
