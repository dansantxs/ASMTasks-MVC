'use client';

import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/layout/table';
import { Input } from '../../../components/ui/form/input';
import { Label } from '../../../components/ui/form/label';
import { Button } from '../../../components/ui/base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/form/select';
import { Combobox } from '../../../components/ui/form/combobox';
import { FileSpreadsheet, FileText, Filter, History, ListChecks } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from '@/utils/exceljs-compat';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../services/configuracoes/api';
import { obterRodapeRelatorio, obterLogotipo } from '../../../services/configuracoes/reportBranding';
import TourGuia from '../../../components/TourGuia';
import { getHistoricoTarefas, getHistoricoProjetosRelatorio } from './api/historicoTarefas';
import { getColaboradoresKanban, getProjetosKanban, getClientesKanban, getEtapasKanban } from '../../projetos/kanban/api/kanban';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { ROTULO_RESERVADO, ehEtapaElaboracao } from '../../../utils/situacaoTarefa';

const columns = [
  { id: 'dataHoraAcao', label: 'Data/Hora' },
  { id: 'tipoLabel', label: 'Ação' },
  { id: 'tarefaId', label: 'ID Tarefa' },
  { id: 'tarefaTitulo', label: 'Título da Tarefa' },
  { id: 'projetoTitulo', label: 'Projeto' },
  { id: 'clienteNome', label: 'Cliente' },
  { id: 'colaboradorNome', label: 'Colaborador' },
  { id: 'etapaNome', label: 'Etapa' },
  { id: 'observacao', label: 'Observação' },
];

const reportTitle = 'Relatório de Histórico de Tarefas';

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

const getTipoLabel = (tipo) => {
  if (tipo === 'E') return 'Mudança de Etapa';
  if (tipo === 'A') return 'Atribuição de Colaborador';
  if (tipo === 'I') return 'Início de Elaboração';
  if (tipo === 'P') return 'Elaboração Pausada';
  if (tipo === 'F') return 'Elaboração Finalizada';
  if (tipo === 'C') return 'Projeto Concluído';
  if (tipo === 'R') return 'Projeto Reaberto';
  return tipo ?? ' ';
};

// Enquanto o usuário ainda está digitando o ano no <input type="date">, o navegador já reporta
// um valor "completo" com o ano truncado (ex.: 0020-08-26 depois de digitar só "20") — sem essa
// checagem, isso vira uma busca com uma data absurda a cada tecla, derrubando o backend com
// "SqlDateTime overflow" antes do usuário terminar de digitar o ano.
function anoCompleto(dateValue) {
  const ano = Number(dateValue?.slice(0, 4));
  return Number.isFinite(ano) && ano >= 1753;
}

function toIsoStartOfDay(dateValue) {
  if (!dateValue || !anoCompleto(dateValue)) return null;
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEndOfDay(dateValue) {
  if (!dateValue || !anoCompleto(dateValue)) return null;
  return new Date(`${dateValue}T23:59:59`).toISOString();
}

export default function HistoricoTarefasReportPage() {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [colaboradorFilter, setColaboradorFilter] = useState('todos');
  const [projetoFilter, setProjetoFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [dataInicioFilter, setDataInicioFilter] = useState('');
  const [dataFimFilter, setDataFimFilter] = useState('');
  const [etapaFilter, setEtapaFilter] = useState('todos');
  const [ultimaOcorrencia, setUltimaOcorrencia] = useState(false);
  const [sortConfig, setSortConfig] = useState({ column: 'dataHoraAcao', direction: 'desc' });
  const [selectedColumns, setSelectedColumns] = useState(columns.map((c) => c.id));
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

  const queryParams = useMemo(
    () => ({
      // "Reservada" não é um tipo gravado no histórico: é uma mudança de etapa (E) que a tela
      // reconhece pelo destino e por ainda não ter havido início. O servidor recebe 'E'.
      tipo: tipoFilter === 'reservada' ? 'E' : tipoFilter,
      colaboradorId: colaboradorFilter,
      projetoId: projetoFilter,
      clienteId: clienteFilter,
      etapaId: etapaFilter,
      ultimaOcorrencia,
      dataInicio: toIsoStartOfDay(dataInicioFilter),
      dataFim: toIsoEndOfDay(dataFimFilter),
    }),
    [tipoFilter, colaboradorFilter, projetoFilter, clienteFilter, etapaFilter, ultimaOcorrencia, dataInicioFilter, dataFimFilter]
  );
  // Espera o filtro parar de mudar por um instante antes de buscar — evita disparar uma busca a
  // cada tecla digitada (nas datas, isso também dava tempo pro ano ficar completo antes de valer).
  const queryParamsDebounced = useDebouncedValue(queryParams, 400);

  const { data: historicoTarefasApi = { registros: [], totalTarefas: 0 }, isLoading: isLoadingTarefas } = useQuery({
    queryKey: ['relatorio-historico-tarefas', queryParamsDebounced],
    queryFn: () => getHistoricoTarefas(queryParamsDebounced),
  });

  const { data: historicoProjetosApi = [], isLoading: isLoadingProjetos } = useQuery({
    queryKey: ['relatorio-historico-projetos', queryParamsDebounced],
    queryFn: () => getHistoricoProjetosRelatorio(queryParamsDebounced),
  });

  const isLoading = isLoadingTarefas || isLoadingProjetos;

  const { data: colaboradoresRaw = [] } = useQuery({
    queryKey: ['relatorio-tarefas-colaboradores'],
    queryFn: getColaboradoresKanban,
  });

  const { data: projetosRaw = [] } = useQuery({
    queryKey: ['relatorio-tarefas-projetos'],
    queryFn: getProjetosKanban,
  });

  const { data: clientesRaw = [] } = useQuery({
    queryKey: ['relatorio-tarefas-clientes'],
    queryFn: getClientesKanban,
  });

  const { data: etapasRaw = [] } = useQuery({
    queryKey: ['relatorio-tarefas-etapas'],
    queryFn: getEtapasKanban,
  });

  const colaboradores = useMemo(() => colaboradoresRaw.filter((c) => c.ativo !== false), [colaboradoresRaw]);
  const projetos = useMemo(
    () => projetosRaw.filter((p) => p.ativo !== false).map((p) => ({ ...p, nome: p.titulo })),
    [projetosRaw]
  );
  const clientes = useMemo(() => clientesRaw.filter((c) => c.ativo !== false), [clientesRaw]);
  const etapas = useMemo(() => etapasRaw.filter((e) => e.ativo !== false), [etapasRaw]);
  const totalTarefas = historicoTarefasApi.totalTarefas ?? 0;

  const exibicaoNomeCliente = systemSettings?.exibicaoNomeCliente ?? 'razaoSocial';

  function resolverNomeCliente(item) {
    if (exibicaoNomeCliente === 'nomeFantasia' && item.clienteNomeFantasia) return item.clienteNomeFantasia;
    return item.clienteNome ?? ' ';
  }

  const data = useMemo(() => {
    const tarefas = (historicoTarefasApi.registros ?? []).map((item) => {
      // Entrar na etapa de elaboração sem nunca ter sido iniciada é o momento em que a tarefa
      // ficou reservada. O fim desse período é a linha "Início de Elaboração".
      const reservada =
        item.tipo === 'E' && ehEtapaElaboracao(item.etapaNome) && !item.elaboracaoJaIniciadaNoEvento;

      return {
        id: `t-${item.id}`,
        rawDataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
        dataHoraAcao: formatDateTime(item.dataHoraAcao),
        tipo: item.tipo,
        reservada,
        tipoLabel: reservada ? ROTULO_RESERVADO : getTipoLabel(item.tipo),
        tarefaId: item.tarefaId,
        tarefaTitulo: item.tarefaTitulo ?? ' ',
        projetoTitulo: item.projetoTitulo ?? ' ',
        clienteNome: resolverNomeCliente(item),
        // Na linha "Reservada" o responsável gravado é o de ANTES da troca de etapa — quem
        // ficou com a reserva vem do backend em responsavelReservaNome.
        colaboradorNome: (reservada ? item.responsavelReservaNome : item.colaboradorNome) ?? ' ',
        etapaNome: item.etapaNome ?? ' ',
        observacao: item.observacao ?? ' ',
      };
    });

    const projetos = etapaFilter !== 'todos' ? [] : historicoProjetosApi.map((item) => ({
      id: `p-${item.id}`,
      rawDataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
      dataHoraAcao: formatDateTime(item.dataHoraAcao),
      tipo: item.tipo,
      tipoLabel: getTipoLabel(item.tipo),
      tarefaId: null,
      tarefaTitulo: '—',
      projetoTitulo: item.projetoTitulo ?? ' ',
      clienteNome: resolverNomeCliente(item),
      colaboradorNome: item.realizadoPorColaboradorNome ?? ' ',
      etapaNome: '—',
      observacao: ' ',
    }));

    return [...tarefas, ...projetos];
  }, [historicoTarefasApi, historicoProjetosApi, exibicaoNomeCliente, etapaFilter]);

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        // O servidor devolveu todas as mudanças de etapa; aqui fica só o que estava reservado.
        if (tipoFilter === 'reservada' && !item.reservada) return false;
        const term = search.toLowerCase();
        if (!term) return true;
        return (
          item.tarefaTitulo.toLowerCase().includes(term) ||
          item.projetoTitulo.toLowerCase().includes(term) ||
          item.clienteNome.toLowerCase().includes(term) ||
          item.colaboradorNome.toLowerCase().includes(term)
        );
      }),
    [data, search, tipoFilter]
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
      tarefaId: (a, b) => compareNumbers(a.tarefaId, b.tarefaId),
      tarefaTitulo: (a, b) => compareStrings(a.tarefaTitulo, b.tarefaTitulo),
      projetoTitulo: (a, b) => compareStrings(a.projetoTitulo, b.projetoTitulo),
      clienteNome: (a, b) => compareStrings(a.clienteNome, b.clienteNome),
      colaboradorNome: (a, b) => compareStrings(a.colaboradorNome, b.colaboradorNome),
      etapaNome: (a, b) => compareStrings(a.etapaNome, b.etapaNome),
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
    const colaboradorNome =
      colaboradorFilter === 'todos'
        ? null
        : colaboradores.find((c) => c.id === Number(colaboradorFilter))?.nome ?? `#${colaboradorFilter}`;
    const projetoNome =
      projetoFilter === 'todos'
        ? null
        : projetos.find((p) => p.id === Number(projetoFilter))?.nome ?? `#${projetoFilter}`;
    const clienteNome =
      clienteFilter === 'todos'
        ? null
        : clientes.find((c) => c.id === Number(clienteFilter))?.nome ?? `#${clienteFilter}`;

    const etapaNome =
      etapaFilter === 'todos'
        ? null
        : etapas.find((e) => e.id === Number(etapaFilter))?.nome ?? `#${etapaFilter}`;

    const filters = [
      search ? `Busca: ${search}` : null,
      tipoFilter !== 'todos'
        ? `Ação: ${tipoFilter === 'reservada' ? ROTULO_RESERVADO : getTipoLabel(tipoFilter)}`
        : null,
      colaboradorNome ? `Colaborador: ${colaboradorNome}` : null,
      projetoNome ? `Projeto: ${projetoNome}` : null,
      clienteNome ? `Cliente: ${clienteNome}` : null,
      etapaNome ? `Etapa: ${etapaNome}` : null,
      ultimaOcorrencia ? 'Última ocorrência por tarefa/etapa' : null,
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
    const countLine = `Total: ${sortedData.length} registro(s) | ${totalTarefas} tarefa(s) distinta(s)`;
    const filtersLines = doc.splitTextToSize(`Filtros: ${filtersSummary}`, pageWidth - 70);
    const columnsLines = doc.splitTextToSize(columnsSummary, pageWidth - 70);
    const headerEndY = 30 + 6 + filtersLines.length * 6 + columnsLines.length * 6;

    autoTable(doc, {
      head: [activeColumns.map((c) => c.label)],
      body,
      styles: { fontSize: 8 },
      headStyles: { overflow: 'ellipsize' },
      margin: { top: headerEndY + 8, bottom: 28, left: 14, right: 14 },
      didDrawPage: () => {
        doc.setFontSize(12);
        doc.text(reportTitle, 14, 16);
        if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', pageWidth - 50, 10, 36, 28);
        doc.setFontSize(9);
        doc.text(`Data de emissão: ${emissionDate}`, 14, 24);
        doc.text(countLine, 14, 30);
        doc.text(filtersLines, 14, 36);
        doc.text(columnsLines, 14, 36 + filtersLines.length * 6);
        doc.setDrawColor(200);
        doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
        doc.setFontSize(8);
        const visibleFooterLines = footerLines.slice(0, 4);
        const footerStartY = pageHeight - 8 - (visibleFooterLines.length - 1) * 4;
        visibleFooterLines.forEach((line, index) => {
          doc.text(line, 14, footerStartY + index * 4);
        });
        doc.text(`Pagina ${doc.internal.getNumberOfPages()}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
      },
    });

    doc.save('relatorio-historico-tarefas.pdf');
  };

  const exportToExcel = async () => {
    const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));
    const { filtersSummary, columnsSummary } = buildFiltersSummary(activeColumns);
    const emissionDate = new Date().toLocaleString('pt-BR');
    const footerLines = obterRodapeRelatorio(systemSettings);

    const headerRows = [
      [reportTitle],
      [`Data de emissão: ${emissionDate}`],
      [`Total: ${sortedData.length} registro(s) | ${totalTarefas} tarefa(s) distinta(s)`],
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
        { s: { r: 4, c: 0 }, e: { r: 4, c: lastColumnIndex } },
      ];
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico');
    await XLSX.writeFile(workbook, 'relatorio-historico-tarefas.xlsx');
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
            popover: { title: 'Histórico de Tarefas', description: 'Acompanhe o ciclo de vida das tarefas: atribuições, movimentações de etapa, inícios/pausas de elaboração e conclusões de projetos.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-relatorio-exportar',
            popover: { title: 'Exportar Dados', description: 'Exporte em <strong>Excel (.xlsx)</strong> ou <strong>PDF</strong> com filtros e colunas selecionados.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-relatorio-filtros',
            popover: { title: 'Filtros', description: 'Filtre por <strong>tipo de ação</strong>, <strong>colaborador</strong>, <strong>projeto</strong>, <strong>cliente</strong> e <strong>período</strong>. Os filtros são consultados no servidor.<br>A ação <strong>Reservada</strong> é a entrada na etapa de elaboração antes de qualquer início — o fim desse período é a linha <strong>Início de Elaboração</strong>.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-relatorio-colunas',
            popover: { title: 'Seleção de Colunas', description: 'Escolha quais colunas serão exibidas e exportadas.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-relatorio-tabela',
            popover: { title: 'Tabela de Resultados', description: 'Clique no cabeçalho de uma coluna para <strong>ordenar</strong>. Por padrão, ordenado pela data mais recente.', side: 'top', align: 'center' },
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

  const activeColumns = columns.filter((c) => selectedColumns.includes(c.id));

  // Não retorna cedo em isLoading: isso desmontaria os campos de filtro (incluindo os de data) a
  // cada busca — inclusive as disparadas por cada tecla digitada — fazendo o campo perder o foco.
  // O carregamento é sinalizado dentro da tabela de resultados, mantendo os filtros montados.

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div id="tour-relatorio-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <History className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatório de Histórico de Tarefas</h1>
              <p className="text-muted-foreground">Visualize o ciclo de vida das tarefas: atribuições, movimentações e inícios de elaboração</p>
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
                  <Input placeholder="Tarefa, projeto, cliente ou colaborador" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div>
                  <Label>Ação</Label>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger><SelectValue placeholder="Ação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="E">Mudança de Etapa</SelectItem>
                      <SelectItem value="reservada">Reservada</SelectItem>
                      <SelectItem value="A">Atribuição de Colaborador</SelectItem>
                      <SelectItem value="I">Início de Elaboração</SelectItem>
                      <SelectItem value="P">Elaboração Pausada</SelectItem>
                      <SelectItem value="F">Elaboração Finalizada</SelectItem>
                      <SelectItem value="C">Projeto Concluído</SelectItem>
                      <SelectItem value="R">Projeto Reaberto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Colaborador</Label>
                  <Combobox
                    value={colaboradorFilter}
                    onValueChange={setColaboradorFilter}
                    placeholder="Colaborador"
                    searchPlaceholder="Buscar colaborador..."
                    options={[
                      { value: 'todos', label: 'Todos' },
                      ...colaboradores.map((c) => ({ value: String(c.id), label: c.nome })),
                    ]}
                  />
                </div>
                <div>
                  <Label>Projeto</Label>
                  <Combobox
                    value={projetoFilter}
                    onValueChange={setProjetoFilter}
                    placeholder="Projeto"
                    searchPlaceholder="Buscar projeto..."
                    options={[
                      { value: 'todos', label: 'Todos' },
                      ...projetos.map((p) => ({ value: String(p.id), label: p.nome })),
                    ]}
                  />
                </div>
                <div>
                  <Label>Etapa</Label>
                  <Select value={etapaFilter} onValueChange={setEtapaFilter}>
                    <SelectTrigger><SelectValue placeholder="Etapa" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas</SelectItem>
                      {etapas.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <input
                      type="checkbox"
                      checked={ultimaOcorrencia}
                      onChange={(e) => setUltimaOcorrencia(e.target.checked)}
                      className="rounded"
                    />
                    Última ocorrência
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <CardTitle className="flex items-center justify-between flex-wrap gap-2">
              <span>{filteredData.length} registro(s)</span>
              {totalTarefas > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {totalTarefas} tarefa(s) distinta(s) no servidor
                </span>
              )}
            </CardTitle>
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
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={activeColumns.length} className="text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && sortedData.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/40">
                      {activeColumns.map((col) => (
                        <TableCell key={col.id}>{row[col.id]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {!isLoading && filteredData.length === 0 && (
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
