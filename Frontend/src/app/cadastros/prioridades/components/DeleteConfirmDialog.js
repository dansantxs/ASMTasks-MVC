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
  priority,
  onConfirm,
  hasActiveTasks,
}) {
  if (!priority) return null;

  const handleConfirm = () => {
    if (!hasActiveTasks) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasActiveTasks ? 'Não é possível excluir a prioridade' : 'Confirmar exclusão'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {hasActiveTasks ? (
              <div className="space-y-4">
                <div>
                  A prioridade <strong>"{priority.name}"</strong> não pode ser excluída porque possui{' '}
                  <strong>tarefas em andamento</strong>.
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Para excluir esta prioridade, primeiro você deve realocar todas as tarefas em andamento
                    para outras prioridades ou finalizá-las.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  Esta validação garante que o histórico de tarefas seja preservado e que não haja
                  tarefas órfãs no sistema.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  Tem certeza que deseja excluir a prioridade <strong>"{priority.name}"</strong>?
                </div>
                <div className="text-sm text-muted-foreground">
                  Esta ação irá inativar a prioridade, preservando o histórico de tarefas associadas.
                  A prioridade não aparecerá mais nas listagens ativas, mas poderá ser reativada posteriormente.
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {hasActiveTasks ? 'Entendi' : 'Cancelar'}
          </AlertDialogCancel>
          {!hasActiveTasks && (
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}