'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/base/dialog';
import { Button } from '../../../ui/base/button';
import { Label } from '../../../ui/form/label';
import { Textarea } from '../../../ui/form/textarea';

export default function DialogoConcluirAtendimento({
  open,
  onOpenChange,
  atendimento,
  aoConfirmar,
  salvando,
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
            Registre um comentário ou resumo da reunião.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="observacaoConclusao">Observação de conclusão</Label>
          <Textarea
            id="observacaoConclusao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: Reunião concluída com alinhamento dos próximos passos."
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => aoConfirmar(observacao)}
            disabled={salvando || !atendimento?.id}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {salvando ? 'Concluindo...' : 'Concluir atendimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
