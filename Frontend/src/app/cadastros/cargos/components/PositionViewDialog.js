'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Button } from '../../../../ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Separator } from '../../../../ui/layout/separator';
import { Briefcase, RefreshCw } from 'lucide-react';

export default function PositionViewDialog({ open, onOpenChange, position, onReactivate }) {
  if (!position) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-brand-blue" />
            Detalhes do Cargo
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações detalhadas do cargo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{position.name}</CardTitle>
                <Badge variant={position.active ? "default" : "secondary"}
                       className={position.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
                  {position.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {position.description && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm leading-relaxed">{position.description}</p>
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
                  <p className="text-muted-foreground">ID do Cargo</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{position.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={position.active ? 'text-green-600' : 'text-amber-600'}>
                    {position.active ? 'Cargo ativo no sistema' : 'Cargo inativado (exclusão lógica)'}
                  </p>
                </div>
              </div>
              
              {!position.active && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        <strong>Cargo Inativo:</strong> Este cargo foi excluído logicamente do sistema. 
                        Todos os colaboradores associados foram preservados para manter o histórico.
                      </p>
                    </div>
                    {onReactivate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onReactivate(position);
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
