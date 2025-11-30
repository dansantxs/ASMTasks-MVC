'use client';

import { useState } from 'react';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Badge } from '../../../../ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../ui/layout/table';
import { Search, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : '—');

export default function ClientList({
  clients,
  onEdit,
  onDelete,
  onView,
  onReactivate,
  viewMode,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = clients.filter((c) =>
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.documento && c.documento.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ativos = filtered.filter((c) => c.active);
  const inativos = filtered.filter((c) => !c.active);

  const ClientCard = ({ client }) => (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{client.name}</CardTitle>
          <Badge
            variant={client.active ? 'default' : 'secondary'}
            className={client.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
          >
            {client.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">{client.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'}:</span>{' '}
            {client.documento}
          </p>
          {client.tipoPessoa === 'F' && client.rg && (
            <p>
              <span className="font-medium">RG:</span> {client.rg}
            </p>
          )}
          {client.tipoPessoa === 'J' && client.inscricaoEstadual && (
            <p>
              <span className="font-medium">Inscrição Estadual:</span> {client.inscricaoEstadual}
            </p>
          )}
          {client.email && (
            <p>
              <span className="font-medium">Email:</span> {client.email}
            </p>
          )}
          {client.site && (
            <p>
              <span className="font-medium">Site:</span> {client.site}
            </p>
          )}
          {client.dataReferencia && (
            <p>
              <span className="font-medium">
                {client.tipoPessoa === 'J' ? 'Inauguração:' : 'Nascimento:'}
              </span>{' '}
              {formatDate(client.dataReferencia)}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(client)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(client)} className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {client.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(client)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(client)}
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

  const ClientRow = ({ client }) => (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{client.name}</TableCell>
      <TableCell>{client.documento}</TableCell>
      <TableCell>{client.tipoPessoa === 'J' ? 'Jurídica' : 'Física'}</TableCell>
      <TableCell>
        <Badge
          variant={client.active ? 'default' : 'secondary'}
          className={client.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
        >
          {client.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(client)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(client)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          {client.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(client)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivate(client)}
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
          placeholder="Buscar clientes por nome ou CPF/CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {viewMode === 'cards' ? (
        <>
          {ativos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Clientes Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {ativos.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ativos.map((c) => (<ClientCard key={c.id} client={c} />))}
              </div>
            </div>
          )}

          {inativos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Clientes Inativos</h3>
                <Badge variant="outline">{inativos.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inativos.map((c) => (<ClientCard key={c.id} client={c} />))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {ativos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Clientes Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {ativos.length}
                </Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-brand-blue">Nome/Razão Social</TableHead>
                      <TableHead className="font-medium text-brand-blue">Documento</TableHead>
                      <TableHead className="font-medium text-brand-blue">Tipo</TableHead>
                      <TableHead className="font-medium text-brand-blue">Status</TableHead>
                      <TableHead className="text-right font-medium text-brand-blue">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ativos.map((c) => (<ClientRow key={c.id} client={c} />))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {inativos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Clientes Inativos</h3>
                <Badge variant="outline">{inativos.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome/Razão Social</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inativos.map((c) => (<ClientRow key={c.id} client={c} />))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3>Nenhum cliente encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? `Não encontramos clientes que correspondam à busca "${searchTerm}".`
                : 'Ainda não há clientes cadastrados no sistema.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}