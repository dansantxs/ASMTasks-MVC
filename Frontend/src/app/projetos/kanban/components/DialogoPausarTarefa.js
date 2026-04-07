'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Pause } from 'lucide-react';
import { Button } from '../../../../ui/base/button';

export default function DialogoPausarTarefa({ open, onOpenChange, tarefa, onConfirmar, isConfirmando }) {
  const [observacao, setObservacao] = useState('');

  const handleConfirmar = () => {
    onConfirmar?.(observacao.trim() || null);
  };

  const handleOpenChange = (v) => {
    if (!v) setObservacao('');
    onOpenChange(v);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60]" />
        <Dialog.Content className="fixed z-[60] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-100 rounded-lg">
                <Pause className="h-4 w-4 text-orange-600" />
              </div>
              <Dialog.Title className="text-base font-semibold text-gray-900">
                Pausar tarefa
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button tabIndex={-1} className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {tarefa && (
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-medium text-gray-700">{tarefa.titulo}</span>
            </p>
          )}

          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Motivo da pausa <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
              rows={3}
              placeholder="Descreva o motivo..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              maxLength={500}
            />
            {observacao.length > 0 && (
              <p className="text-xs text-gray-400 text-right mt-0.5">{observacao.length}/500</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" tabIndex={-1} onClick={() => handleOpenChange(false)} disabled={isConfirmando}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
              onClick={handleConfirmar}
              disabled={isConfirmando}
            >
              <Pause className="h-3.5 w-3.5" />
              {isConfirmando ? 'Pausando...' : 'Confirmar pausa'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
