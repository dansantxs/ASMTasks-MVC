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

export default function ListaPrioridades({
  prioridades,
  aoEditar,
  aoExcluir,
  aoVisualizar,
  aoReativar,
  modoVisualizacao,
}) {
  const isClient = useClientOnly();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPrioridades = prioridades.filter(prioridade =>
    (prioridade.name && prioridade.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (prioridade.description && prioridade.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const prioridadesAtivas = filteredPrioridades.filter(prioridade => prioridade.active);
  const prioridadesInativas = filteredPrioridades.filter(prioridade => !prioridade.active);

  const PrioridadeCard = ({ prioridade }) => (
    <Card key={prioridade.id} className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{prioridade.name}</CardTitle>
          <Badge
            variant={prioridade.active ? "default" : "secondary"}
            className={prioridade.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}
          >
            {prioridade.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {prioridade.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {prioridade.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Cor da Prioridade:</span>
            <input
              type="color"
              value={prioridade.color || '#000000'}
              disabled
              style={{ width: 24, height: 24, border: 'none', background: 'none', padding: 0 }}
              title={prioridade.color}
            />
            <span>{prioridade.color}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => aoVisualizar(prioridade)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aoEditar(prioridade)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {prioridade.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aoExcluir(prioridade)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aoReativar(prioridade)}
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

  const PrioridadeRow = ({ prioridade }) => (
    <TableRow key={prioridade.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{prioridade.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm text-muted-foreground truncate" title={prioridade.description || ''}>
          {prioridade.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={prioridade.color || '#000000'}
            disabled
            style={{ width: 24, height: 24, border: 'none', background: 'none', padding: 0 }}
            title={prioridade.color}
          />
          <span className="text-sm">{prioridade.color}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={prioridade.active ? "default" : "secondary"}
          className={prioridade.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}
        >
          {prioridade.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => aoVisualizar(prioridade)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => aoEditar(prioridade)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {prioridade.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => aoExcluir(prioridade)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => aoReativar(prioridade)}
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
      <div id="tour-busca" className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar prioridades por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {modoVisualizacao === 'cards' ? (
        <>
          {prioridadesAtivas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{prioridadesAtivas.length}</Badge>
              </div>
              <div id="tour-lista-ativos" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prioridadesAtivas.map(prioridade => (
                  <PrioridadeCard key={prioridade.id} prioridade={prioridade} />
                ))}
              </div>
            </div>
          )}

          {prioridadesInativas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Inativas</h3>
                <Badge variant="outline">{prioridadesInativas.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prioridadesInativas.map(prioridade => (
                  <PrioridadeCard key={prioridade.id} prioridade={prioridade} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {prioridadesAtivas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{prioridadesAtivas.length}</Badge>
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
                    {prioridadesAtivas.map(prioridade => (
                      <PrioridadeRow key={prioridade.id} prioridade={prioridade} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {prioridadesInativas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Prioridades Inativas</h3>
                <Badge variant="outline">{prioridadesInativas.length}</Badge>
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
                    {prioridadesInativas.map(prioridade => (
                      <PrioridadeRow key={prioridade.id} prioridade={prioridade} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filteredPrioridades.length === 0 && (
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
