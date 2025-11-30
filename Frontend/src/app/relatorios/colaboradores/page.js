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
import { Download, Filter, ListChecks, Users2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getColaboradores } from '../../cadastros/colaboradores/api/colaboradores';
import { getSetores } from '../../cadastros/setores/api/setores';
import { getCargos } from '../../cadastros/cargos/api/cargos';

const columns = [
  { id: 'name', label: 'Nome' },
  { id: 'cpf', label: 'CPF' },
  { id: 'status', label: 'Status' },
  { id: 'setor', label: 'Setor' },
  { id: 'cargo', label: 'Cargo' },
  { id: 'dataNascimento', label: 'Data de Nascimento' },
  { id: 'dataAdmissao', label: 'Data de Admissão' },
  { id: 'email', label: 'E-mail' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'uf', label: 'UF' },
];

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : ' ');

export default function ColaboradoresReportPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [setorFilter, setSetorFilter] = useState('todos');
  const [cargoFilter, setCargoFilter] = useState('todos');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState(columns.map((c) => c.id));

  const { data: colaboradoresApi = [], isLoading: loadingColaboradores } = useQuery({
    queryKey: ['relatorio-colaboradores'],
    queryFn: getColaboradores,
  });

  const { data: setoresApi = [] } = useQuery({
    queryKey: ['relatorio-setores'],
    queryFn: getSetores,
  });

  const { data: cargosApi = [] } = useQuery({
    queryKey: ['relatorio-cargos'],
    queryFn: getCargos,
  });

  const data = useMemo(
    () =>
      colaboradoresApi.map((c) => {
        const setor = setoresApi.find((s) => s.id === c.setorId);
        const cargo = cargosApi.find((cg) => cg.id === c.cargoId);
        return {
          id: c.id,
          name: c.nome,
          cpf: c.cpf,
          status: c.ativo ? 'Ativo' : 'Inativo',
          setor: setor ? setor.nome : ' ',
          cargo: cargo ? cargo.nome : ' ',
          dataNascimento: formatDate(c.dataNascimento),
          dataAdmissao: formatDate(c.dataAdmissao),
          rawDataNascimento: c.dataNascimento,
          rawDataAdmissao: c.dataAdmissao,
          email: c.email || ' ',
          telefone: c.telefone || ' ',
          cidade: c.cidade || ' ',
          uf: c.uf || ' ',
          rawAtivo: c.ativo,
          setorId: c.setorId,
          cargoId: c.cargoId,
        };
      }),
    [colaboradoresApi, setoresApi, cargosApi]
  );

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const name = item.name ? item.name.toLowerCase() : '';
        const cpf = item.cpf ? item.cpf.toLowerCase() : '';
        const matchesSearch =
          name.includes(search.toLowerCase()) ||
          cpf.includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === 'todos' ||
          (statusFilter === 'ativos' && item.rawAtivo) ||
          (statusFilter === 'inativos' && !item.rawAtivo);
        const matchesSetor = setorFilter === 'todos' || item.setorId === Number(setorFilter);
        const matchesCargo = cargoFilter === 'todos' || item.cargoId === Number(cargoFilter);
        return matchesSearch && matchesStatus && matchesSetor && matchesCargo;
      }),
    [data, search, statusFilter, setorFilter, cargoFilter]
  );

  const sortedData = useMemo(() => {
    const dataToSort = [...filteredData];

    const compareStrings = (a = '', b = '') =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
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
      cpf: (a, b) => compareStrings(a.cpf, b.cpf),
      status: (a, b) => compareStrings(a.status, b.status),
      setor: (a, b) => compareStrings(a.setor, b.setor),
      cargo: (a, b) => compareStrings(a.cargo, b.cargo),
      dataNascimento: (a, b) => compareDates(a.rawDataNascimento, b.rawDataNascimento),
      dataAdmissao: (a, b) => compareDates(a.rawDataAdmissao, b.rawDataAdmissao),
      email: (a, b) => compareStrings(a.email, b.email),
      telefone: (a, b) => compareStrings(a.telefone, b.telefone),
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

    doc.save('relatorio-colaboradores.pdf');
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');
    XLSX.writeFile(workbook, 'relatorio-colaboradores.xlsx');
  };

  if (loadingColaboradores) {
    return <div className="p-6">Carregando relatório de colaboradores...</div>;
  }

  const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Users2 className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatório de Colaboradores</h1>
              <p className="text-muted-foreground">
                Filtre, ordene e exporte os registros dos colaboradores
              </p>
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
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Busca</Label>
                  <Input
                    placeholder="Busque por nome ou CPF"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Setor</Label>
                  <Select value={setorFilter} onValueChange={setSetorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {setoresApi.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cargo</Label>
                  <Select value={cargoFilter} onValueChange={setCargoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {cargosApi.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
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
                        Nenhum colaborador encontrado com os filtros selecionados.
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
