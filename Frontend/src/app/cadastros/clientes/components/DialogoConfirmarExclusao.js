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
  cliente,
  aoConfirmar,
  possuiTarefasAtivas,
}) {
  if (!cliente) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar inativação</AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div>
                Tem certeza que deseja inativar o cliente <strong>"{cliente.name}"</strong>?
              </div>

              {possuiTarefasAtivas && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Este cliente possui projetos ou atendimentos ativos. Eles não serão
                    afetados — o cliente ficará inativo, mas todo o histórico é preservado.
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground">
                O cliente não aparecerá mais nas listagens ativas, mas poderá ser reativado
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
