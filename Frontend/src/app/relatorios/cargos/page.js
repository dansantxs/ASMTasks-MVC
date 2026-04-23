'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/layout/table';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/form/select';
import { FileSpreadsheet, FileText, Filter, ListChecks, Briefcase } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getCargos } from '../../cadastros/cargos/api/cargos';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../shared/configuracoes-sistema/api';
import TourGuia from '../../../shared/components/TourGuia';
import { obterRodapeRelatorio, obterLogotipo } from '../../../shared/configuracoes-sistema/reportBranding';

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Nome do Cargo' },
  { id: 'description', label: 'Descrição' },
  { id: 'status', label: 'Status' },
];

const reportTitle = 'Relatorio de Cargos';

export default function CargosReportPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState(columns.map((c) => c.id));
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

  const { data: cargosApi = [], isLoading } = useQuery({
    queryKey: ['relatorio-cargos'],
    queryFn: getCargos,
  });

  const data = useMemo(
    () =>
      cargosApi.map((c) => ({
        id: c.id,
        name: c.nome || ' ',
        description: c.descricao || ' ',
        status: c.ativo ? 'Ativo' : 'Inativo',
        rawAtivo: c.ativo,
      })),
    [cargosApi]
  );

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const name = item.name ? item.name.toLowerCase() : '';
        const description = item.description ? item.description.toLowerCase() : '';
        const searchLower = search.toLowerCase();
        const matchesSearch = name.includes(searchLower) || description.includes(searchLower);
        const matchesStatus =
          statusFilter === 'todos' ||
          (statusFilter === 'ativos' && item.rawAtivo) ||
          (statusFilter === 'inativos' && !item.rawAtivo);
        return matchesSearch && matchesStatus;
      }),
    [data, search, statusFilter]
  );

  const sortedData = useMemo(() => {
    const dataToSort = [...filteredData];
    const compareStrings = (a = '', b = '') =>
      String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' });
    const compareNumbers = (a = 0, b = 0) => Number(a) - Number(b);

    const sorters = {
      id: (a, b) => compareNumbers(a.id, b.id),
      name: (a, b) => compareStrings(a.name, b.name),
      description: (a, b) => compareStrings(a.description, b.description),
      status: (a, b) => compareStrings(a.status, b.status),
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
    const logoDataUrl = await obterLogotipo(systemSettings);
    const footerLines = obterRodapeRelatorio(systemSettings);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const filtersLines = doc.splitTextToSize(`Filtros: ${filtersSummary}`, pageWidth - 70);
    const columnsLines = doc.splitTextToSize(columnsSummary, pageWidth - 70);
    const headerEndY = 30 + (filtersLines.length * 6) + (columnsLines.length * 6);

    autoTable(doc, {
      head: [activeColumns.map((c) => c.label)],
      body,
      styles: { fontSize: 8 },
      headStyles: { overflow: 'ellipsize' },
      margin: { top: headerEndY + 8, bottom: 28, left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text(reportTitle, 14, 16);

        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', pageWidth - 50, 10, 36, 28);
        }

        doc.setFontSize(9);
        doc.text(`Data de emiss?o: ${emissionDate}`, 14, 24);

        const filtersStartY = 30;
        doc.text(filtersLines, 14, filtersStartY);

        const columnsStartY = filtersStartY + filtersLines.length * 6;
        doc.text(columnsLines, 14, columnsStartY);
        doc.setDrawColor(200);
        doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

        doc.setFontSize(8);
        const visibleFooterLines = footerLines.slice(0, 4);
        const footerStartY = pageHeight - 8 - ((visibleFooterLines.length - 1) * 4);
        visibleFooterLines.forEach((line, index) => {
          doc.text(line, 14, footerStartY + (index * 4));
        });
        doc.text(
          `Pagina ${doc.internal.getNumberOfPages()}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: 'right' }
        );
      },
    });

    doc.save('relatorio-cargos.pdf');
  };

  const exportToExcel = async () => {
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const { filtersSummary, columnsSummary } = buildFiltersSummary(activeColumns);
    const emissionDate = new Date().toLocaleString('pt-BR');
    const footerLines = obterRodapeRelatorio(systemSettings);

    const headerRows = [
      [reportTitle],
      [`Data de emiss?o: ${emissionDate}`],
      [`Filtros: ${filtersSummary}`],
      [columnsSummary],
      [],
      activeColumns.map((c) => c.label),
    ];

    const dataRows = sortedData.map((row) => activeColumns.map((col) => row[col.id] ?? ''));
    const footerRows = [[], ...footerLines.map((line) => [line])];

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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cargos');
    XLSX.writeFile(workbook, 'relatorio-cargos.xlsx');
  };

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      const tour = driver({
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Próximo →',
        prevBtnText: '← Anterior',
        doneBtnText: '✓ Concluir',
        overlayOpacity: 0.6,
        smoothScroll: true,
        steps: [
          {
            element: '#tour-relatorio-cabecalho',
            popover: {
              title: 'Relatório de Cargos',
              description: 'Visualize, filtre e exporte os dados de todos os cargos cadastrados no sistema.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-relatorio-exportar',
            popover: {
              title: 'Exportar Dados',
              description: 'Exporte o relatório filtrado em <strong>Excel (.xlsx)</strong> ou <strong>PDF</strong>, com cabeçalho, filtros aplicados e rodapé configurado nas configurações do sistema.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-relatorio-filtros',
            popover: {
              title: 'Filtros',
              description: 'Filtre os dados por <strong>busca</strong> (nome ou descrição) e por <strong>status</strong> (ativos, inativos ou todos). Os resultados são atualizados automaticamente.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-relatorio-colunas',
            popover: {
              title: 'Seleção de Colunas',
              description: 'Escolha quais colunas serão exibidas na tabela e incluídas na exportação. Desmarque colunas desnecessárias para um relatório mais enxuto.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-relatorio-tabela',
            popover: {
              title: 'Tabela de Resultados',
              description: 'Exibe os cargos conforme os filtros aplicados. Clique no cabeçalho de uma coluna para <strong>ordenar</strong> os dados de forma crescente ou decrescente.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-relatorio-filtros',
            popover: {
              title: 'Possíveis Erros e Dicas',
              description: '⚠️ <strong>Sem resultados:</strong> nenhum registro corresponde aos filtros aplicados — amplie os critérios ou limpe os filtros.<br>⛔ <strong>Sem colunas selecionadas:</strong> selecione ao menos uma coluna antes de exportar.<br>⛔ <strong>Erro ao exportar:</strong> verifique sua conexão e tente novamente. Se persistir, reduza os registros usando os filtros.',
              side: 'bottom',
              align: 'start',
            },
          },
        ],
      });
      tour.drive();
    });
  }, []);

  if (isLoading) {
    return <div className="p-6">Carregando relatorio de cargos...</div>;
  }

  const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div id="tour-relatorio-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatorio de Cargos</h1>
              <p className="text-muted-foreground">Visualize, filtre e exporte os dados de cargos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-relatorio-exportar" className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2" onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
              </Button>
              <Button className="bg-brand-blue hover:bg-brand-blue-dark flex items-center gap-2" onClick={exportToPDF}>
                <FileText className="h-4 w-4" /> Exportar PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card id="tour-relatorio-filtros" className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label>Busca</Label>
                  <Input
                    placeholder="Busque por nome ou descricao"
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
            </CardContent>
          </Card>

          <Card id="tour-relatorio-colunas">
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

        <Card id="tour-relatorio-tabela">
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
                        Nenhum cargo encontrado com os filtros selecionados.
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
