'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Badge } from '../../../../ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../ui/layout/table';
import { Search, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';

function useClientOnly() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return isClient;
}

export default function PriorityList({
  priorities,
  onEdit,
  onDelete,
  onView,
  onReactivate,
  viewMode,
}) {
  const isClient = useClientOnly();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPriorities = priorities.filter(priority =>
    (priority.name && priority.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (priority.description && priority.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activePriorities = filteredPriorities.filter(priority => priority.active);
  const inactivePriorities = filteredPriorities.filter(priority => !priority.active);

  const PriorityCard = ({ priority }) => (
    <Card key={priority.id} className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{priority.name}</CardTitle>
          <Badge
            variant={priority.active ? "default" : "secondary"}
            className={priority.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}
          >
            {priority.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {priority.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {priority.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Cor da Prioridade:</span>
            <input
              type="color"
              value={priority.color || '#000000'}
              disabled
              style={{ width: 24, height: 24, border: 'none', background: 'none', padding: 0 }}
              title={priority.color}
            />
            <span>{priority.color}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(priority)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(priority)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {priority.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(priority)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(priority)}
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

  const PriorityRow = ({ priority }) => (
    <TableRow key={priority.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{priority.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm text-muted-foreground truncate" title={priority.description || ''}>
          {priority.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={priority.color || '#000000'}
            disabled
            style={{ width: 24, height: 24, border: 'none', background: 'none', padding: 0 }}
            title={priority.color}
          />
          <span className="text-sm">{priority.color}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={priority.active ? "default" : "secondary"}
          className={priority.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}
        >
          {priority.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(priority)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(priority)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {priority.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(priority)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivate(priority)}
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
          placeholder="Buscar prioridades por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {viewMode === 'cards' ? (
        <>
          {activePriorities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{activePriorities.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activePriorities.map(priority => (
                  <PriorityCard key={priority.id} priority={priority} />
                ))}
              </div>
            </div>
          )}

          {inactivePriorities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Inativas</h3>
                <Badge variant="outline">{inactivePriorities.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactivePriorities.map(priority => (
                  <PriorityCard key={priority.id} priority={priority} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {activePriorities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{activePriorities.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-brand-blue">Nome da Prioridade</TableHead>
                      <TableHead className="font-medium text-brand-blue">Descrição</TableHead>
                      <TableHead className="font-medium text-brand-blue">Cor da Prioridade</TableHead>
                      <TableHead className="font-medium text-brand-blue">Status</TableHead>
                      <TableHead className="font-medium text-brand-blue">Data de Criação</TableHead>
                      <TableHead className="text-right font-medium text-brand-blue">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePriorities.map(priority => (
                      <PriorityRow key={priority.id} priority={priority} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {inactivePriorities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Inativas</h3>
                <Badge variant="outline">{inactivePriorities.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome da Prioridade</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Cor da Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactivePriorities.map(priority => (
                      <PriorityRow key={priority.id} priority={priority} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filteredPriorities.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3>Nenhuma prioridade encontrada</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? `Não encontramos prioridades que correspondam à busca "${searchTerm}".`
                : 'Ainda não há prioridades cadastradas no sistema.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}