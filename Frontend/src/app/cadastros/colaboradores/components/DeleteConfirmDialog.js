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
} from '../../../../ui/feedback/alert/alert-dialog';
import { Alert, AlertDescription } from '../../../../ui/feedback/alert/alert';
import { AlertTriangle } from 'lucide-react';

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  employee,
  onConfirm,
  hasActiveTasks,
}) {
  if (!employee) return null;

  const hasBlockingItems = !!hasActiveTasks;

  const handleConfirm = () => {
    if (!hasBlockingItems) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasBlockingItems
              ? 'Não é possível inativar o colaborador'
              : 'Confirmar inativação'}
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            {hasBlockingItems ? (
              <div className="space-y-4">
                <div>
                  O colaborador <strong>"{employee.name}"</strong> não pode ser inativado porque possui:
                </div>

                <ul className="ml-4 list-disc space-y-1">
                  <li>
                    <strong>Tarefas em andamento</strong>
                  </li>
                </ul>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Para inativar este colaborador, primeiro realoque ou finalize as tarefas em andamento.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  Esta validação garante que o histórico de tarefas seja preservado e que não haja registros
                  órfãos no sistema.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  Tem certeza que deseja inativar o colaborador <strong>"{employee.name}"</strong>?
                </div>
                <div className="text-sm text-muted-foreground">
                  Esta ação irá inativar o colaborador, preservando o histórico de tarefas e vínculos associados.
                  Ele não aparecerá mais nas listagens ativas, mas poderá ser reativado posteriormente.
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            {hasBlockingItems ? 'Entendi' : 'Cancelar'}
          </AlertDialogCancel>

          {!hasBlockingItems && (
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Inativação
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
