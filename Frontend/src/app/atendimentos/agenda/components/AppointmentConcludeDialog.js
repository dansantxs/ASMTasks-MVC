'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';

export default function AppointmentConcludeDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
  isSaving,
}) {
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    if (!open) {
      setObservacao('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Concluir atendimento</DialogTitle>
          <DialogDescription>
            Registre um comentario ou resumo da reuniao.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="observacaoConclusao">Observacao de conclusao</Label>
          <Textarea
            id="observacaoConclusao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: Reuniao concluida com alinhamento dos proximos passos."
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(observacao)}
            disabled={isSaving || !appointment?.id}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? 'Concluindo...' : 'Concluir atendimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
