'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/layout/table';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/form/select';
import { FileSpreadsheet, FileText, Filter, History, ListChecks } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../shared/configuracoes-sistema/api';
import { obterRodapeRelatorio, obterLogotipo } from '../../../shared/configuracoes-sistema/reportBranding';
import TourGuia from '../../../shared/components/TourGuia';
import { getHistoricoAtendimentos } from './api/historicoAtendimentos';
import { getClientes, getColaboradores } from '../../atendimentos/api/atendimentos';

const columns = [
  { id: 'dataHoraAcao', label: 'Data/Hora' },
  { id: 'tipoLabel', label: 'Ação' },
  { id: 'atendimentoId', label: 'ID' },
  { id: 'atendimentoTitulo', label: 'Título do Atendimento' },
  { id: 'clienteNome', label: 'Cliente' },
  { id: 'colaboradorNome', label: 'Usuário' },
  { id: 'statusAtualLabel', label: 'Status Atual' },
  { id: 'observacao', label: 'Observação' },
];

const reportTitle = 'Relatório de Histórico de Atendimentos';

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : ' ';

const getTipoLabel = (tipo) => (tipo === 'C' ? 'Conclusão' : tipo === 'R' ? 'Reabertura' : ' ');
const getStatusLabel = (status) => (status === 'R' ? 'Concluído' : status === 'A' ? 'Agendado' : status ?? ' ');

function toIsoStartOfDay(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEndOfDay(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T23:59:59`).toISOString();
}

export default function HistoricoAtendimentosReportPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [colaboradorFilter, setColaboradorFilter] = useState('todos');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: 'dataHoraAcao', direction: 'desc' });
  const [selectedColumns, setSelectedColumns] = useState(columns.map((c) => c.id));
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

  const historicoQueryParams = useMemo(
    () => ({
      tipo: tipoFilter,
      clienteId: clienteFilter,
      colaboradorId: colaboradorFilter,
      dataInicio: toIsoStartOfDay(dataInicioFilter),
      dataFim: toIsoEndOfDay(dataFimFilter),
    }),
    [tipoFilter, clienteFilter, colaboradorFilter, dataInicioFilter, dataFimFilter]
  );

  const { data: historicoApi = [], isLoading } = useQuery({
    queryKey: ['relatorio-historico-atendimentos', historicoQueryParams],
    queryFn: () => getHistoricoAtendimentos(historicoQueryParams),
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['relatorio-historico-clientes'],
    queryFn: getClientes,
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['relatorio-historico-colaboradores'],
    queryFn: getColaboradores,
  });

  const data = useMemo(
    () =>
      historicoApi.map((item) => ({
        id: item.id,
        dataHoraAcao: formatDateTime(item.dataHoraAcao),
        rawDataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
        tipo: item.tipo,
        tipoLabel: getTipoLabel(item.tipo),
        atendimentoId: item.atendimentoId,
        atendimentoTitulo: item.atendimentoTitulo ?? ' ',
        clienteNome: item.clienteNome ?? ' ',
        colaboradorNome: item.colaboradorNome ?? ' ',
        statusAtual: item.atendimentoStatusAtual,
        statusAtualLabel: getStatusLabel(item.atendimentoStatusAtual),
        observacao: item.observacao ?? ' ',
      })),
    [historicoApi]
  );

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const term = search.toLowerCase();
        if (!term) return true;

        return (
          item.atendimentoTitulo.toLowerCase().includes(term) ||
          item.observacao.toLowerCase().includes(term)
        );
      }),
    [data, search]
  );

  const sortedData = useMemo(() => {
    const dataToSort = [...filteredData];

    const compareStrings = (a = '', b = '') => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    const compareNumbers = (a, b) => a - b;
    const compareDates = (a, b) => {
      if (!a && !b) return 0;
      if (!a) return -1;
      if (!b) return 1;
      return a - b;
    };

    const sorters = {
      dataHoraAcao: (a, b) => compareDates(a.rawDataHoraAcao, b.rawDataHoraAcao),
      tipoLabel: (a, b) => compareStrings(a.tipoLabel, b.tipoLabel),
      atendimentoId: (a, b) => compareNumbers(a.atendimentoId, b.atendimentoId),
      atendimentoTitulo: (a, b) => compareStrings(a.atendimentoTitulo, b.atendimentoTitulo),
      clienteNome: (a, b) => compareStrings(a.clienteNome, b.clienteNome),
      colaboradorNome: (a, b) => compareStrings(a.colaboradorNome, b.colaboradorNome),
      statusAtualLabel: (a, b) => compareStrings(a.statusAtualLabel, b.statusAtualLabel),
      observacao: (a, b) => compareStrings(a.observacao, b.observacao),
    };

    const sorter = sorters[sortConfig.column];
    if (sorter) {
      dataToSort.sort((a, b) => (sortConfig.direction === 'asc' ? sorter(a, b) : sorter(b, a)));
    }

    return dataToSort;
  }, [filteredData, sortConfig]);

  const toggleColumn = (id) => {
    setSelectedColumns((prev) => (prev.includes(id) ? prev.filter((col) => col !== id) : [...prev, id]));
  };

  const handleSort = (columnId) => {
    setSortConfig((prev) =>
      prev.column === columnId
        ? { column: columnId, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { column: columnId, direction: 'asc' }
    );
  };

  const buildFiltersSummary = (activeColumns) => {
    const clienteNome = clienteFilter === 'todos'
      ? null
      : clientes.find((c) => c.id === Number(clienteFilter))?.nome ?? `#${clienteFilter}`;
    const colaboradorNome = colaboradorFilter === 'todos'
      ? null
      : colaboradores.find((c) => c.id === Number(colaboradorFilter))?.nome ?? `#${colaboradorFilter}`;

    const filters = [
      search ? `Busca: ${search}` : null,
      tipoFilter !== 'todos' ? `Ação: ${getTipoLabel(tipoFilter)}` : null,
      clienteNome ? `Cliente: ${clienteNome}` : null,
      colaboradorNome ? `Usuário: ${colaboradorNome}` : null,
      dataInicioFilter ? `Data início: ${new Date(`${dataInicioFilter}T00:00:00`).toLocaleDateString('pt-BR')}` : null,
      dataFimFilter ? `Data fim: ${new Date(`${dataFimFilter}T00:00:00`).toLocaleDateString('pt-BR')}` : null,
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
        doc.text(`Data de emissão: ${emissionDate}`, 14, 24);
        doc.text(filtersLines, 14, 30);
        doc.text(columnsLines, 14, 30 + filtersLines.length * 6);

        doc.setDrawColor(200);
        doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

        doc.setFontSize(8);
        const visibleFooterLines = footerLines.slice(0, 4);
        const footerStartY = pageHeight - 8 - ((visibleFooterLines.length - 1) * 4);
        visibleFooterLines.forEach((line, index) => {
          doc.text(line, 14, footerStartY + (index * 4));
        });
        doc.text(`Pagina ${doc.internal.getNumberOfPages()}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
      },
    });

    doc.save('relatorio-historico-atendimentos.pdf');
  };

  const exportToExcel = async () => {
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const { filtersSummary, columnsSummary } = buildFiltersSummary(activeColumns);
    const emissionDate = new Date().toLocaleString('pt-BR');
    const footerLines = obterRodapeRelatorio(systemSettings);

    const headerRows = [
      [reportTitle],
      [`Data de emissão: ${emissionDate}`],
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico');
    XLSX.writeFile(workbook, 'relatorio-historico-atendimentos.xlsx');
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
            popover: { title: 'Histórico de Atendimentos', description: 'Acompanhe todas as conclusões e reaberturas de atendimentos num período, filtrando por cliente ou colaborador.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-relatorio-exportar',
            popover: { title: 'Exportar Dados', description: 'Exporte em <strong>Excel (.xlsx)</strong> ou <strong>PDF</strong> com filtros e colunas selecionados.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-relatorio-filtros',
            popover: { title: 'Filtros', description: 'Filtre por <strong>tipo de ação</strong>, <strong>cliente</strong>, <strong>colaborador</strong> e <strong>período</strong> (data início/fim). Os filtros de período são consultados diretamente no servidor.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-relatorio-colunas',
            popover: { title: 'Seleção de Colunas', description: 'Escolha quais colunas serão exibidas e exportadas.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-relatorio-tabela',
            popover: { title: 'Tabela de Resultados', description: 'Clique no cabeçalho de uma coluna para <strong>ordenar</strong>. Por padrão, ordenado pela data mais recente.', side: 'top', align: 'center' },
          },
        ],
      });
      tour.drive();
    });
  }, []);

  if (isLoading) {
    return <div className="p-6">Carregando relatório de histórico de atendimentos...</div>;
  }

  const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div id="tour-relatorio-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <History className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatório de Histórico de Atendimentos</h1>
              <p className="text-muted-foreground">Visualize, filtre e exporte conclusões e reaberturas</p>
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
                  <Input placeholder="Título ou observação" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div>
                  <Label>Ação</Label>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="C">Conclusão</SelectItem>
                      <SelectItem value="R">Reabertura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={clienteFilter} onValueChange={setClienteFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={String(cliente.id)}>{cliente.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Usuário</Label>
                  <Select value={colaboradorFilter} onValueChange={setColaboradorFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Usuário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {colaboradores.map((colaborador) => (
                        <SelectItem key={colaborador.id} value={String(colaborador.id)}>{colaborador.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data início</Label>
                  <Input type="date" value={dataInicioFilter} onChange={(e) => setDataInicioFilter(e.target.value)} />
                </div>
                <div>
                  <Label>Data fim</Label>
                  <Input type="date" value={dataFimFilter} onChange={(e) => setDataFimFilter(e.target.value)} />
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
                            <span className="text-xs">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
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
                        Nenhum registro encontrado com os filtros selecionados.
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
