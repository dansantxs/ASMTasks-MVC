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

export default function ListaEtapas({
  etapas,
  aoEditar,
  aoExcluir,
  aoVisualizar,
  aoReativar,
  viewMode,
}) {
  const isClient = useClientOnly();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEtapas = etapas.filter(
    (etapa) =>
      (etapa.name && etapa.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (etapa.description && etapa.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const etapasAtivas = filteredEtapas.filter((etapa) => etapa.active);
  const etapasInativas = filteredEtapas.filter((etapa) => !etapa.active);

  const EtapaCard = ({ etapa }) => (
    <Card key={etapa.id} className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{etapa.name}</CardTitle>
          <Badge
            variant={etapa.active ? 'default' : 'secondary'}
            className={etapa.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
          >
            {etapa.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {etapa.description && <p className="text-sm text-muted-foreground line-clamp-2">{etapa.description}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => aoVisualizar(etapa)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => aoEditar(etapa)} className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {etapa.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aoExcluir(etapa)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aoReativar(etapa)}
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

  const EtapaRow = ({ etapa }) => (
    <TableRow key={etapa.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{etapa.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm text-muted-foreground truncate" title={etapa.description || ''}>
          {etapa.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={etapa.active ? 'default' : 'secondary'}
          className={etapa.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
        >
          {etapa.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => aoVisualizar(etapa)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => aoEditar(etapa)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          {etapa.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => aoExcluir(etapa)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => aoReativar(etapa)}
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
          {etapasAtivas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {etapasAtivas.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {etapasAtivas.map((etapa) => (
                  <EtapaCard key={etapa.id} etapa={etapa} />
                ))}
              </div>
            </div>
          )}

          {etapasInativas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Inativas</h3>
                <Badge variant="outline">{etapasInativas.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {etapasInativas.map((etapa) => (
                  <EtapaCard key={etapa.id} etapa={etapa} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {etapasAtivas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Ativas</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {etapasAtivas.length}
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
                    {etapasAtivas.map((etapa) => (
                      <EtapaRow key={etapa.id} etapa={etapa} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {etapasInativas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Etapas Inativas</h3>
                <Badge variant="outline">{etapasInativas.length}</Badge>
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
                    {etapasInativas.map((etapa) => (
                      <EtapaRow key={etapa.id} etapa={etapa} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filteredEtapas.length === 0 && (
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
