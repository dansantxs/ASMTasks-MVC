'use client';

import { useMemo, useState, useCallback } from 'react';
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
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../shared/configuracoes-sistema/api';
import { obterRodapeRelatorio, obterLogotipo } from '../../../shared/configuracoes-sistema/reportBranding';
import TourGuia from '../../../shared/components/TourGuia';

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
const reportTitle = 'Relatório de Colaboradores';

export default function ColaboradoresReportPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [setorFilter, setSetorFilter] = useState('todos');
  const [cargoFilter, setCargoFilter] = useState('todos');
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [selectedColumns, setSelectedColumns] = useState(columns.map((c) => c.id));
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

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

  const getSetorNome = (id) => {
    const setor = setoresApi.find((s) => s.id === Number(id));
    return setor ? setor.nome : '';
  };

  const getCargoNome = (id) => {
    const cargo = cargosApi.find((c) => c.id === Number(id));
    return cargo ? cargo.nome : '';
  };

  const buildFiltersSummary = (activeColumns) => {
    const filters = [
      search ? `Busca: ${search}` : null,
      statusFilter !== 'todos'
        ? `Status: ${statusFilter === 'ativos' ? 'Ativos' : 'Inativos'}`
        : null,
      setorFilter !== 'todos' ? `Setor: ${getSetorNome(setorFilter)}` : null,
      cargoFilter !== 'todos' ? `Cargo: ${getCargoNome(cargoFilter)}` : null,
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
          `Página ${doc.internal.getNumberOfPages()}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: 'right' }
        );
      },
    });

    doc.save('relatorio-colaboradores.pdf');
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
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colaboradores');
    XLSX.writeFile(workbook, 'relatorio-colaboradores.xlsx');
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
            popover: { title: 'Relatório de Colaboradores', description: 'Visualize, filtre e exporte dados dos colaboradores, incluindo setor, cargo, contato e datas de admissão.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-relatorio-exportar',
            popover: { title: 'Exportar Dados', description: 'Exporte em <strong>Excel (.xlsx)</strong> ou <strong>PDF</strong> com filtros e colunas selecionados.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-relatorio-filtros',
            popover: { title: 'Filtros', description: 'Filtre por <strong>busca</strong>, <strong>status</strong>, <strong>setor</strong> e <strong>cargo</strong>.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-relatorio-colunas',
            popover: { title: 'Seleção de Colunas', description: 'Escolha quais colunas serão exibidas e exportadas.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-relatorio-tabela',
            popover: { title: 'Tabela de Resultados', description: 'Clique no cabeçalho de uma coluna para <strong>ordenar</strong> os dados.', side: 'top', align: 'center' },
          },
        ],
      });
      tour.drive();
    });
  }, []);

  if (loadingColaboradores) {
    return <div className="p-6">Carregando relatório de colaboradores...</div>;
  }

  const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div id="tour-relatorio-cabecalho" className="flex items-center gap-3">
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
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-relatorio-exportar" className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2" onClick={exportToExcel}>
                <Download className="h-4 w-4" /> Exportar Excel
              </Button>
              <Button className="bg-brand-blue hover:bg-brand-blue-dark flex items-center gap-2" onClick={exportToPDF}>
                <Download className="h-4 w-4" /> Exportar PDF
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card id="tour-relatorio-filtros" className="lg:col-span-2">
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
