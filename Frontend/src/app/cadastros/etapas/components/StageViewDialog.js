'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Button } from '../../../../ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Workflow, RefreshCw } from 'lucide-react';

export default function StageViewDialog({ open, onOpenChange, stage, onReactivate }) {
  if (!stage) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-brand-blue" />
            Detalhes da Etapa
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações detalhadas da etapa
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{stage.name}</CardTitle>
                <Badge
                  variant={stage.active ? 'default' : 'secondary'}
                  className={stage.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
                >
                  {stage.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stage.description && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm leading-relaxed">{stage.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID da Etapa</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{stage.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={stage.active ? 'text-green-600' : 'text-amber-600'}>
                    {stage.active ? 'Etapa ativa no sistema' : 'Etapa inativada (exclusão lógica)'}
                  </p>
                </div>
              </div>
              {!stage.active && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        <strong>Etapa Inativa:</strong> Esta etapa foi excluída logicamente do sistema. Todas as tarefas
                        associadas foram preservadas para manter o histórico.
                      </p>
                    </div>
                    {onReactivate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onReactivate(stage);
                          onOpenChange(false);
                        }}
                        className="ml-3 text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}