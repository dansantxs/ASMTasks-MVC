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

export default function SectorList({
  sectors,
  onEdit,
  onDelete,
  onView,
  onReactivate,
  viewMode,
}) {
  const isClient = useClientOnly();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSectors = sectors.filter((sector) =>
    (sector.name && sector.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (sector.description && sector.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeSectors = filteredSectors.filter((sector) => sector.active);
  const inactiveSectors = filteredSectors.filter((sector) => !sector.active);

  const SectorCard = ({ sector }) => (
    <Card key={sector.id} className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{sector.name}</CardTitle>
          <Badge variant={sector.active ? "default" : "secondary"} className={sector.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
            {sector.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {sector.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {sector.description}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(sector)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(sector)}
            className="flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {sector.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(sector)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(sector)}
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

  const SectorRow = ({ sector }) => (
    <TableRow key={sector.id} className="hover:bg-muted/50">
      <TableCell className="font-medium">{sector.name}</TableCell>
      <TableCell className="max-w-xs">
        <div className="text-sm text-muted-foreground truncate" title={sector.description || ''}>
          {sector.description || '-'}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={sector.active ? "default" : "secondary"} className={sector.active ? "bg-brand-blue hover:bg-brand-blue-dark" : ""}>
          {sector.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(sector)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(sector)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          {sector.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(sector)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivate(sector)}
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
          placeholder="Buscar setores por nome ou descricao..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {viewMode === 'cards' ? (
        <>
          {activeSectors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Setores Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{activeSectors.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeSectors.map((sector) => (
                  <SectorCard key={sector.id} sector={sector} />
                ))}
              </div>
            </div>
          )}

          {inactiveSectors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Setores Inativos</h3>
                <Badge variant="outline">{inactiveSectors.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveSectors.map((sector) => (
                  <SectorCard key={sector.id} sector={sector} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {activeSectors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Setores Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">{activeSectors.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-brand-blue">Nome do Setor</TableHead>
                      <TableHead className="font-medium text-brand-blue">Descricao</TableHead>
                      <TableHead className="font-medium text-brand-blue">Status</TableHead>
                      <TableHead className="text-right font-medium text-brand-blue">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSectors.map((sector) => (
                      <SectorRow key={sector.id} sector={sector} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {inactiveSectors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Setores Inativos</h3>
                <Badge variant="outline">{inactiveSectors.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome do Setor</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveSectors.map((sector) => (
                      <SectorRow key={sector.id} sector={sector} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {isClient && filteredSectors.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3>Nenhum setor encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? `Nao encontramos setores que correspondam a busca "${searchTerm}".`
                : 'Ainda nao ha setores cadastrados no sistema.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
