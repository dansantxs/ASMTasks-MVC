'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Button } from '../../../../ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Separator } from '../../../../ui/layout/separator';
import { Palette, Flag, RefreshCw } from 'lucide-react';

export default function PriorityViewDialog({ open, onOpenChange, priority, onReactivate }) {
  if (!priority) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-brand-blue" />
            Detalhes da Prioridade
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações detalhadas da prioridade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{priority.name}</CardTitle>
                <Badge
                  variant={priority.active ? 'default' : 'secondary'}
                  className={priority.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
                >
                  {priority.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {priority.description && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm leading-relaxed">{priority.description}</p>
                  </div>

                  <Separator />
                </>
              )}

              <div className="flex items-center gap-3">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Cor da Prioridade</p>
                  <input
                    type="color"
                    value={priority.color || '#000000'}
                    disabled
                    className="w-8 h-8 border-none bg-transparent p-0 cursor-default"
                    style={{ pointerEvents: 'none' }}
                  />
                  <span className="ml-2 font-mono text-xs">{priority.color}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID da Prioridade</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{priority.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={priority.active ? 'text-green-600' : 'text-amber-600'}>
                    {priority.active ? 'Prioridade ativa no sistema' : 'Prioridade inativada (exclusão lógica)'}
                  </p>
                </div>
              </div>

              {!priority.active && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        <strong>Prioridade Inativa:</strong> Esta prioridade foi excluída logicamente do sistema. Todas as tarefas associadas foram preservadas para manter o histórico.
                      </p>
                    </div>
                    {onReactivate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onReactivate(priority);
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