'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/layout/table';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { Badge } from '../../../ui/base/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/form/select';
import { Download, Filter, ListChecks, Handshake } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getClientes } from '../../cadastros/clientes/api/cliente';

const columns = [
  { id: 'name', label: 'Nome/Razão Social' },
  { id: 'documento', label: 'CPF/CNPJ' },
  { id: 'tipoPessoa', label: 'Tipo' },
  { id: 'status', label: 'Status' },
  { id: 'dataReferencia', label: 'Nascimento/Inauguração' },
  { id: 'email', label: 'E-mail' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'site', label: 'Site' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'uf', label: 'UF' },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : ' ');

export default function ClientesReportPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState(columns.map((c) => c.id));

  const { data: clientesApi = [], isLoading } = useQuery({
    queryKey: ['relatorio-clientes'],
    queryFn: getClientes,
  });

  const data = useMemo(
    () =>
      clientesApi.map((c) => ({
        id: c.id,
        name: c.nome,
        documento: c.documento,
        tipoPessoa: c.tipoPessoa,
        status: c.ativo ? 'Ativo' : 'Inativo',
        dataReferencia: formatDate(c.dataReferencia),
        rawDataReferencia: c.dataReferencia,
        email: c.email || ' ',
        telefone: c.telefone || ' ',
        site: c.site || ' ',
        cidade: c.cidade || ' ',
        uf: c.uf || ' ',
        rawAtivo: c.ativo,
      })),
    [clientesApi]
  );

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const name = item.name ? item.name.toLowerCase() : '';
        const documento = item.documento ? item.documento.toLowerCase() : '';
        const matchesSearch =
          name.includes(search.toLowerCase()) ||
          documento.includes(search.toLowerCase());
        const matchesTipo = tipoFilter === 'todos' || item.tipoPessoa === tipoFilter;
        const matchesStatus =
          statusFilter === 'todos' ||
          (statusFilter === 'ativos' && item.rawAtivo) ||
          (statusFilter === 'inativos' && !item.rawAtivo);
        return matchesSearch && matchesTipo && matchesStatus;
      }),
    [data, search, tipoFilter, statusFilter]
  );

  const sortedData = useMemo(() => {
    const dataToSort = [...filteredData];

    const compareStrings = (a = '', b = '') => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    const compareDates = (a, b) => {
      const dateA = a ? new Date(a) : null;
      const dateB = b ? new Date(b) : null;
      if (!dateA && !dateB) return 0;
      if (!dateA) return -1;
      if (!dateB) return 1;
      return dateA - dateB;
    };

    const sorters = {
      name: (a, b) => compareStrings(a.name, b.name),
      documento: (a, b) => compareStrings(a.documento, b.documento),
      tipoPessoa: (a, b) => compareStrings(a.tipoPessoa, b.tipoPessoa),
      status: (a, b) => compareStrings(a.status, b.status),
      dataReferencia: (a, b) => compareDates(a.rawDataReferencia, b.rawDataReferencia),
      email: (a, b) => compareStrings(a.email, b.email),
      telefone: (a, b) => compareStrings(a.telefone, b.telefone),
      site: (a, b) => compareStrings(a.site, b.site),
      cidade: (a, b) => compareStrings(a.cidade, b.cidade),
      uf: (a, b) => compareStrings(a.uf, b.uf),
    };

    const sorter = sorters[sortConfig.column];
    if (sorter) {
      dataToSort.sort((a, b) =>
        sortConfig.direction === 'asc' ? sorter(a, b) : sorter(b, a)
      );
    }

    return dataToSort;
  }, [filteredData, sortConfig]);

  const toggleColumn = (id) => {
    setSelectedColumns((prev) =>
      prev.includes(id) ? prev.filter((col) => col !== id) : [...prev, id]
    );
  };

  const handleSort = (columnId) => {
    setSortConfig((prev) =>
      prev.column === columnId
        ? { column: columnId, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: columnId, direction: 'asc' }
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const body = sortedData.map((row) => activeColumns.map((col) => row[col.id] ?? ''));

    autoTable(doc, {
      head: [activeColumns.map((c) => c.label)],
      body,
      styles: { fontSize: 8 },
    });

    doc.save('relatorio-clientes.pdf');
  };

  const exportToExcel = () => {
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const worksheetData = sortedData.map((row) => {
      const item = {};
      activeColumns.forEach((col) => {
        item[col.label] = row[col.id] ?? '';
      });
      return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, 'relatorio-clientes.xlsx');
  };

  if (isLoading) {
    return <div className="p-6">Carregando relatório de clientes...</div>;
  }

  const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Handshake className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatório de Clientes</h1>
              <p className="text-muted-foreground">Visualize, filtre e exporte os dados de clientes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={exportToExcel}>
              <Download className="h-4 w-4" /> Exportar Excel
            </Button>
            <Button className="bg-brand-blue hover:bg-brand-blue-dark flex items-center gap-2" onClick={exportToPDF}>
              <Download className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Busca</Label>
                  <Input
                    placeholder="Busque por nome ou CPF/CNPJ"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo de Pessoa</Label>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="F">Pessoa Física</SelectItem>
                      <SelectItem value="J">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="ativos">Ativos</SelectItem>
                      <SelectItem value="inativos">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Colunas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {columns.map((col) => (
                <label key={col.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(col.id)}
                    onChange={() => toggleColumn(col.id)}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{filteredData.length} resultado(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-brand-blue/5">
                    {activeColumns.map((col) => (
                      <TableHead key={col.id} className="font-semibold text-brand-blue">
                        <button
                          type="button"
                          onClick={() => handleSort(col.id)}
                          className="flex items-center gap-2 w-full text-left focus:outline-none"
                        >
                          <span>{col.label}</span>
                          {sortConfig.column === col.id && (
                            <span className="text-xs">
                              {sortConfig.direction === 'asc' ? '▲' : '▼'}
                            </span>
                          )}
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      {activeColumns.map((col) => (
                        <TableCell key={col.id}>{row[col.id]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={activeColumns.length} className="text-center text-muted-foreground">
                        Nenhum cliente encontrado com os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
