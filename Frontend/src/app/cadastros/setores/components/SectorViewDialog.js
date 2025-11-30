'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Button } from '../../../../ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Separator } from '../../../../ui/layout/separator';
import { User, Building2, RefreshCw } from 'lucide-react';

export default function SectorViewDialog({ open, onOpenChange, sector, onReactivate }) {
  if (!sector) return null;

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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{sector.name}</CardTitle>
                <Badge variant={sector.active ? "default" : "secondary"}
                       className={sector.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
                  {sector.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {sector.description && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                    <p className="text-sm leading-relaxed">{sector.description}</p>
                  </div>
                  
                  <Separator />
                </>
              )}
              
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{sector.responsibleName}</p>
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
                  <p className="text-muted-foreground">ID do Setor</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{sector.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={sector.active ? 'text-green-600' : 'text-amber-600'}>
                    {sector.active ? 'Setor ativo no sistema' : 'Setor inativado (exclusão lógica)'}
                  </p>
                </div>
              </div>
              
              {!sector.active && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-amber-800">
                        <strong>Setor Inativo:</strong> Este setor foi excluído logicamente do sistema. 
                        Todas as tarefas associadas foram preservadas para manter o histórico.
                      </p>
                    </div>
                    {onReactivate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onReactivate(sector);
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