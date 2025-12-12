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
const companyLegalName = 'Razão Social: Alvaro Shioji Matsuda';
const companyFantasyName = 'Nome Fantasia: Always System Manager';
const reportTitle = 'Relatório de Clientes';
const logoPath = '/logo-asm.png';
let cachedLogoDataUrl = null;

const getLogoDataUrl = async () => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  try {
    const response = await fetch(logoPath);
    if (!response.ok) return null;
    const blob = await response.blob();
    const reader = new FileReader();
    return await new Promise((resolve) => {
      reader.onloadend = () => {
        cachedLogoDataUrl = reader.result;
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erro ao carregar o logotipo para o PDF/Excel', error);
    return null;
  }
};

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

  const buildFiltersSummary = (activeColumns) => {
    const filters = [
      search ? `Busca: ${search}` : null,
      tipoFilter !== 'todos'
        ? `Tipo: ${tipoFilter === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}`
        : null,
      statusFilter !== 'todos'
        ? `Status: ${statusFilter === 'ativos' ? 'Ativos' : 'Inativos'}`
        : null,
    ].filter(Boolean);

    const columnsSummary =
      activeColumns.length > 0
        ? `Colunas: ${activeColumns.map((c) => c.label).join(', ')}`
        : 'Nenhuma coluna selecionada';

    const filtersSummary = filters.length > 0 ? filters.join(' | ') : 'Nenhum filtro aplicado';
    return { filtersSummary, columnsSummary };
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const { filtersSummary, columnsSummary } = buildFiltersSummary(activeColumns);
    const body = sortedData.map((row) => activeColumns.map((col) => row[col.id] ?? ''));
    const emissionDate = new Date().toLocaleString('pt-BR');
    const logoDataUrl = await getLogoDataUrl();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    autoTable(doc, {
      head: [activeColumns.map((c) => c.label)],
      body,
      styles: { fontSize: 8 },
      headStyles: { overflow: 'ellipsize' },
      margin: { top: 52, bottom: 22, left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text(reportTitle, 14, 16);

        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', pageWidth - 50, 10, 36, 28);
        }

        doc.setFontSize(9);
        doc.text(`Data de emissão: ${emissionDate}`, 14, 24);

        const filtersLines = doc.splitTextToSize(`Filtros: ${filtersSummary}`, pageWidth - 70);
        const filtersStartY = 30;
        doc.text(filtersLines, 14, filtersStartY);

        const columnsLines = doc.splitTextToSize(columnsSummary, pageWidth - 70);
        const columnsStartY = filtersStartY + filtersLines.length * 6;
        doc.text(columnsLines, 14, columnsStartY);

        doc.setFontSize(8);
        doc.text(companyLegalName, 14, pageHeight - 14);
        doc.text(companyFantasyName, 14, pageHeight - 8);
        doc.text(
          `Página ${doc.internal.getNumberOfPages()}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: 'right' }
        );
      },
    });

    doc.save('relatorio-clientes.pdf');
  };

  const exportToExcel = async () => {
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const { filtersSummary, columnsSummary } = buildFiltersSummary(activeColumns);
    const emissionDate = new Date().toLocaleString('pt-BR');

    const headerRows = [
      [reportTitle],
      [`Data de emissão: ${emissionDate}`],
      [`Filtros: ${filtersSummary}`],
      [columnsSummary],
      [],
      activeColumns.map((c) => c.label),
    ];

    const dataRows = sortedData.map((row) => activeColumns.map((col) => row[col.id] ?? ''));
    const footerRows = [[], [companyLegalName], [companyFantasyName]];

    const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, ...footerRows]);

    if (activeColumns.length > 1) {
      const lastColumnIndex = activeColumns.length - 1;
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumnIndex } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumnIndex } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: lastColumnIndex } },
      ];
    }

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
