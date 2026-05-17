'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/feedback/alert/alert-dialog';
import { Alert, AlertDescription } from '../../../../components/ui/feedback/alert/alert';
import { AlertTriangle } from 'lucide-react';

export function DialogoConfirmarExclusao({
  open,
  onOpenChange,
  setor,
  aoConfirmar,
  possuiTarefasAtivas,
  possuiColaboradoresAtivos,
}) {
  if (!setor) return null;

  const possuiVinculos = !!(possuiTarefasAtivas || possuiColaboradoresAtivos);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar inativação</AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div>
                Tem certeza que deseja inativar o setor <strong>"{setor.name}"</strong>?
              </div>

              {possuiVinculos && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Este setor possui{' '}
                    {[possuiTarefasAtivas && 'tarefas em andamento', possuiColaboradoresAtivos && 'colaboradores ativos']
                      .filter(Boolean)
                      .join(' e ')}
                    . Eles não serão afetados — o setor ficará inativo, mas todo o histórico é
                    preservado.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                O setor não aparecerá mais nas listagens ativas, mas poderá ser reativado
                a qualquer momento.
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={aoConfirmar}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Confirmar Inativação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
