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

export function DialogoConfirmarExclusao({
  open,
  onOpenChange,
  cargo,
  aoConfirmar,
  possuiColaboradoresAtivos,
}) {
  if (!cargo) return null;

  const handleConfirm = () => {
    if (!possuiColaboradoresAtivos) {
      aoConfirmar();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {possuiColaboradoresAtivos ? 'Não é possível excluir o cargo' : 'Confirmar exclusão'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            {possuiColaboradoresAtivos ? (
              <div className="space-y-4">
                <div>
                  O cargo <strong>"{cargo.name}"</strong> não pode ser excluído porque possui{' '}
                  <strong>colaboradores ativos</strong>.
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Para excluir este cargo, primeiro você deve realocar todos os colaboradores ativos
                    para outros cargos ou finalizá-los.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  Esta validação garante que o histórico de colaboradores seja preservado e que não haja
                  colaboradores órfãos no sistema.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  Tem certeza que deseja excluir o cargo <strong>"{cargo.name}"</strong>?
                </div>
                <div className="text-sm text-muted-foreground">
                  Esta ação irá inativar o cargo, preservando o histórico de colaboradores associadas.
                  O cargo não aparecerá mais nas listagens ativas, mas poderá ser reativado posteriormente.
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {possuiColaboradoresAtivos ? 'Entendi' : 'Cancelar'}
          </AlertDialogCancel>
          {!possuiColaboradoresAtivos && (
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
