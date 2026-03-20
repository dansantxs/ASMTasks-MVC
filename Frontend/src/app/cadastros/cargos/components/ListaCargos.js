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

export default function ListaCargos({
  cargos,
  aoEditar,
  aoExcluir,
  aoVisualizar,
  aoReativar,
  modoVisualizacao,
}) {
  const isClient = useClientOnly();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCargos = cargos.filter(cargo =>
    (cargo.name && cargo.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cargo.description && cargo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const cargosAtivos = filteredCargos.filter(cargo => cargo.active);
  const cargosInativos = filteredCargos.filter(cargo => !cargo.active);

  const CargoCard = ({ cargo }) => (
    <Card key={cargo.id} className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{cargo.name}</CardTitle>
          <Badge variant={cargo.active ? "default" : "secondary"}
                 className={cargo.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
            {cargo.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {cargo.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {cargo.description}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => aoVisualizar(cargo)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => aoEditar(cargo)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {cargo.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aoExcluir(cargo)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => aoReativar(cargo)}
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

  const CargoRow = ({ cargo }) => (
    <TableRow key={cargo.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{cargo.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm text-muted-foreground truncate" title={cargo.description || ''}>
          {cargo.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={cargo.active ? "default" : "secondary"}
               className={cargo.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
          {cargo.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => aoVisualizar(cargo)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => aoEditar(cargo)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {cargo.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => aoExcluir(cargo)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => aoReativar(cargo)}
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
          placeholder="Buscar cargos por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {modoVisualizacao === 'cards' ? (
        <>
          {cargosAtivos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Cargos Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{cargosAtivos.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cargosAtivos.map(cargo => (
                  <CargoCard key={cargo.id} cargo={cargo} />
                ))}
              </div>
            </div>
          )}

          {cargosInativos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Cargos Inativos</h3>
                <Badge variant="outline">{cargosInativos.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cargosInativos.map(cargo => (
                  <CargoCard key={cargo.id} cargo={cargo} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {cargosAtivos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Cargos Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{cargosAtivos.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-brand-blue">Nome do Cargo</TableHead>
                      <TableHead className="font-medium text-brand-blue">Descrição</TableHead>
                      <TableHead className="font-medium text-brand-blue">Status</TableHead>
                      <TableHead className="font-medium text-brand-blue">Data de Criação</TableHead>
                      <TableHead className="text-right font-medium text-brand-blue">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargosAtivos.map(cargo => (
                      <CargoRow key={cargo.id} cargo={cargo} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {cargosInativos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Cargos Inativos</h3>
                <Badge variant="outline">{cargosInativos.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome do Cargo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargosInativos.map(cargo => (
                      <CargoRow key={cargo.id} cargo={cargo} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filteredCargos.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3>Nenhum cargo encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? `Não encontramos cargos que correspondam à busca "${searchTerm}".`
                : 'Ainda não há cargos cadastrados no sistema.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
