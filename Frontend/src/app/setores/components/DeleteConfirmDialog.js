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
} from '../../../ui/feedback/alert/alert-dialog';
import { Alert, AlertDescription } from '../../../ui/feedback/alert/alert';
import { AlertTriangle } from 'lucide-react';

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  sector,
  onConfirm,
  hasActiveTasks,
  activeTasksCount = 0,
}) {
  if (!sector) return null;

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
            {hasActiveTasks ? 'Não é possível excluir o setor' : 'Confirmar exclusão'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {hasActiveTasks ? (
              <div className="space-y-4">
                <div>
                  O setor <strong>"{sector.name}"</strong> não pode ser excluído porque possui{' '}
                  <strong>{activeTasksCount} tarefa(s) em andamento</strong>.
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Para excluir este setor, primeiro você deve realocar todas as tarefas em andamento
                    para outros setores ou finalizá-las.
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
                  Tem certeza que deseja excluir o setor <strong>"{sector.name}"</strong>?
                </div>
                <div className="text-sm text-muted-foreground">
                  Esta ação irá inativar o setor, preservando o histórico de tarefas associadas.
                  O setor não aparecerá mais nas listagens ativas, mas poderá ser reativado posteriormente.
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