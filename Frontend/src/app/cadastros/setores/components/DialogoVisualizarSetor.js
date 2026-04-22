'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Button } from '../../../../ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { RefreshCw, Building2 } from 'lucide-react';

export default function DialogoVisualizarSetor({ open, onOpenChange, setor, aoReativar }) {
  if (!setor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-blue" />
            Detalhes do Setor
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações detalhadas do setor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card id="tour-setor-view-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{setor.name}</CardTitle>
                <Badge variant={setor.active ? "default" : "secondary"} className={setor.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
                  {setor.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {setor.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm leading-relaxed">{setor.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="tour-setor-view-sistema">
            <CardHeader>
              <CardTitle className="text-lg">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID do Setor</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{setor.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={setor.active ? 'text-green-600' : 'text-amber-600'}>
                    {setor.active ? 'Setor ativo no sistema' : 'Setor inativado (exclusao logica)'}
                  </p>
                </div>
              </div>

              {!setor.active && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        <strong>Setor Inativo:</strong> Este setor foi excluido logicamente do sistema.
                        Todas as tarefas associadas foram preservadas para manter o histórico.
                      </p>
                    </div>
                    {aoReativar && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          aoReativar(setor);
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
