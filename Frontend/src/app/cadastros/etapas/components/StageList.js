'use client';

import React, { useState, useEffect } from 'react';
function useClientOnly() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Badge } from '../../../../ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../ui/layout/table';
import { Search, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';

export default function StageList({
  stages,
  onEdit,
  onDelete,
  onView,
  onReactivate,
  viewMode,
}) {
  const isClient = useClientOnly();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStages = stages.filter(
    (stage) =>
      (stage.name && stage.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stage.description && stage.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeStages = filteredStages.filter((stage) => stage.active);
  const inactiveStages = filteredStages.filter((stage) => !stage.active);

  const StageCard = ({ stage }) => (
    <Card key={stage.id} className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{stage.name}</CardTitle>
          <Badge
            variant={stage.active ? 'default' : 'secondary'}
            className={stage.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
          >
            {stage.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {stage.description && <p className="text-sm text-muted-foreground line-clamp-2">{stage.description}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(stage)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(stage)} className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {stage.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(stage)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(stage)}
              className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Reativar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const StageRow = ({ stage }) => (
    <TableRow key={stage.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{stage.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm text-muted-foreground truncate" title={stage.description || ''}>
          {stage.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={stage.active ? 'default' : 'secondary'}
          className={stage.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
        >
          {stage.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(stage)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(stage)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          {stage.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(stage)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivate(stage)}
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-600 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar etapas por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {viewMode === 'cards' ? (
        <>
          {activeStages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {activeStages.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeStages.map((stage) => (
                  <StageCard key={stage.id} stage={stage} />
                ))}
              </div>
            </div>
          )}

          {inactiveStages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Inativas</h3>
                <Badge variant="outline">{inactiveStages.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveStages.map((stage) => (
                  <StageCard key={stage.id} stage={stage} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {activeStages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {activeStages.length}
                </Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-brand-blue">Nome da Etapa</TableHead>
                      <TableHead className="font-medium text-brand-blue">Descrição</TableHead>
                      <TableHead className="font-medium text-brand-blue">Status</TableHead>
                      <TableHead className="font-medium text-brand-blue">Data de Criação</TableHead>
                      <TableHead className="text-right font-medium text-brand-blue">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeStages.map((stage) => (
                      <StageRow key={stage.id} stage={stage} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {inactiveStages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Inativas</h3>
                <Badge variant="outline">{inactiveStages.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome da Etapa</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveStages.map((stage) => (
                      <StageRow key={stage.id} stage={stage} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filteredStages.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3>Nenhuma etapa encontrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? `Não encontramos etapas que correspondam à busca "${searchTerm}".`
                : 'Ainda não há etapas cadastradas no sistema.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
