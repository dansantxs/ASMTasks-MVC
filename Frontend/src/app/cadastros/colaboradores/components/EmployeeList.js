'use client';

import { useState } from 'react';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Badge } from '../../../../ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../ui/layout/table';
import { Search, Edit, Trash2, Eye, RefreshCw } from 'lucide-react';

export default function EmployeeList({
  employees,
  onEdit,
  onDelete,
  onView,
  onReactivate,
  viewMode,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(
    (employee) =>
      (employee.name && employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.cpf && employee.cpf.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.setorNome && employee.setorNome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (employee.cargoNome && employee.cargoNome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeEmployees = filteredEmployees.filter((e) => e.active);
  const inactiveEmployees = filteredEmployees.filter((e) => !e.active);

  const EmployeeCard = ({ employee }) => (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-brand-blue">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{employee.name}</CardTitle>
          <Badge
            variant={employee.active ? 'default' : 'secondary'}
            className={employee.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
          >
            {employee.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">CPF:</span> {employee.cpf}
          </p>
          {employee.cargoNome && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Cargo:</span> {employee.cargoNome}
            </p>
          )}
          {employee.setorNome && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Setor:</span> {employee.setorNome}
            </p>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(employee)}
            className="flex items-center gap-1 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
            Visualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(employee)} className="flex items-center gap-1">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          {employee.active ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(employee)}
              className="flex items-center gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReactivate(employee)}
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

  const EmployeeRow = ({ employee }) => (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{employee.name}</TableCell>
      <TableCell>{employee.cpf}</TableCell>
      <TableCell>{employee.setorNome || '—'}</TableCell>
      <TableCell>{employee.cargoNome || '—'}</TableCell>
      <TableCell>
        <Badge
          variant={employee.active ? 'default' : 'secondary'}
          className={employee.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
        >
          {employee.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(employee)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(employee)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          {employee.active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(employee)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivate(employee)}
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
          placeholder="Buscar colaboradores por nome, CPF, cargo ou setor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {viewMode === 'cards' ? (
        <>
          {activeEmployees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Colaboradores Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {activeEmployees.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeEmployees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            </div>
          )}

          {inactiveEmployees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Colaboradores Inativos</h3>
                <Badge variant="outline">{inactiveEmployees.length}</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inactiveEmployees.map((employee) => (
                  <EmployeeCard key={employee.id} employee={employee} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {activeEmployees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Colaboradores Ativos</h3>
                <Badge variant="outline" className="border-brand-blue text-brand-blue">
                  {activeEmployees.length}
                </Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-medium text-brand-blue">Nome</TableHead>
                      <TableHead className="font-medium text-brand-blue">CPF</TableHead>
                      <TableHead className="font-medium text-brand-blue">Setor</TableHead>
                      <TableHead className="font-medium text-brand-blue">Cargo</TableHead>
                      <TableHead className="font-medium text-brand-blue">Status</TableHead>
                      <TableHead className="text-right font-medium text-brand-blue">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeEmployees.map((employee) => (
                      <EmployeeRow key={employee.id} employee={employee} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {inactiveEmployees.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3>Colaboradores Inativos</h3>
                <Badge variant="outline">{inactiveEmployees.length}</Badge>
              </div>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveEmployees.map((employee) => (
                      <EmployeeRow key={employee.id} employee={employee} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3>Nenhum colaborador encontrado</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchTerm
                ? `Não encontramos colaboradores que correspondam à busca "${searchTerm}".`
                : 'Ainda não há colaboradores cadastrados no sistema.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}