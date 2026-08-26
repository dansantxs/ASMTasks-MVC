'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/layout/table';
import { Label } from '../../../components/ui/form/label';
import { Button } from '../../../components/ui/base/button';
import { Input } from '../../../components/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/form/select';
import { DollarSign, FileSpreadsheet, FileText, Filter, History, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from '@/utils/exceljs-compat';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../services/configuracoes/api';
import { obterRodapeRelatorio, obterLogotipo } from '../../../services/configuracoes/reportBranding';
import { getHistoricoTarefas } from '../projetos-historico/api/historicoTarefas';
import { getColaboradoresKanban, getClientesKanban } from '../../projetos/kanban/api/kanban';

const colunasDetalhado = [
  { id: 'dataHoraAcao', label: 'Data/Hora' },
  { id: 'colaboradorNome', label: 'Colaborador' },
  { id: 'etapaNome', label: 'Etapa' },
  { id: 'tarefaTitulo', label: 'Tarefa' },
  { id: 'projetoTitulo', label: 'Projeto' },
  { id: 'clienteNome', label: 'Cliente' },
];

const colunasResumo = [
  { id: 'colaborador', label: 'Colaborador' },
  { id: 'tarefasDistintas', label: 'Tarefas Distintas' },
  { id: 'passagensEtapa', label: 'Passagens de Etapa' },
];

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

function paraInputDate(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function primeiroDiaDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

function ultimoDiaDoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0);
}

function toIsoStartOfDay(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEndOfDay(dateValue) {
  if (!dateValue) return null;
  return new Date(`${dateValue}T23:59:59`).toISOString();
}

export default function RelatorioComissaoPage() {
  const hoje = new Date();
  const [dataInicioFilter, setDataInicioFilter] = useState(() => paraInputDate(primeiroDiaDoMes(hoje)));
  const [dataFimFilter, setDataFimFilter] = useState(() => paraInputDate(hoje));
  const [colaboradorFilter, setColaboradorFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [aba, setAba] = useState('resumo');
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

  const aplicarMesAtual = () => {
    setDataInicioFilter(paraInputDate(primeiroDiaDoMes(hoje)));
    setDataFimFilter(paraInputDate(hoje));
  };

  const aplicarMesAnterior = () => {
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    setDataInicioFilter(paraInputDate(primeiroDiaDoMes(mesAnterior)));
    setDataFimFilter(paraInputDate(ultimoDiaDoMes(mesAnterior)));
  };

  const queryParams = useMemo(
    () => ({
      tipo: 'E',
      colaboradorId: colaboradorFilter,
      clienteId: clienteFilter,
      dataInicio: toIsoStartOfDay(dataInicioFilter),
      dataFim: toIsoEndOfDay(dataFimFilter),
    }),
    [colaboradorFilter, clienteFilter, dataInicioFilter, dataFimFilter]
  );

  const { data: historicoApi = { registros: [], totalTarefas: 0 }, isLoading } = useQuery({
    queryKey: ['relatorio-comissao', queryParams],
    queryFn: () => getHistoricoTarefas(queryParams),
  });

  const { data: colaboradoresRaw = [] } = useQuery({
    queryKey: ['relatorio-comissao-colaboradores'],
    queryFn: getColaboradoresKanban,
  });

  const { data: clientesRaw = [] } = useQuery({
    queryKey: ['relatorio-comissao-clientes'],
    queryFn: getClientesKanban,
  });

  const colaboradores = useMemo(
    () =>
      colaboradoresRaw
        .filter((c) => c.ativo !== false)
        .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR', { sensitivity: 'base' })),
    [colaboradoresRaw]
  );
  const clientes = useMemo(
    () =>
      clientesRaw
        .filter((c) => c.ativo !== false)
        .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR', { sensitivity: 'base' })),
    [clientesRaw]
  );

  const exibicaoNomeCliente = systemSettings?.exibicaoNomeCliente ?? 'razaoSocial';

  function resolverNomeCliente(item) {
    if (exibicaoNomeCliente === 'nomeFantasia' && item.clienteNomeFantasia) return item.clienteNomeFantasia;
    return item.clienteNome ?? ' ';
  }

  const detalhado = useMemo(
    () =>
      (historicoApi.registros ?? [])
        .map((item) => ({
          id: item.id,
          tarefaId: item.tarefaId,
          rawDataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
          dataHoraAcao: formatDateTime(item.dataHoraAcao),
          colaboradorNome: item.colaboradorNome ?? ' ',
          etapaNome: item.etapaNome ?? ' ',
          tarefaTitulo: item.tarefaTitulo ?? ' ',
          projetoTitulo: item.projetoTitulo ?? ' ',
          clienteNome: resolverNomeCliente(item),
        }))
        .sort((a, b) => (b.rawDataHoraAcao ?? 0) - (a.rawDataHoraAcao ?? 0)),
    [historicoApi, exibicaoNomeCliente]
  );

  const resumo = useMemo(() => {
    const mapa = new Map();
    detalhado.forEach((item) => {
      const chave = item.colaboradorNome;
      if (!mapa.has(chave)) {
        mapa.set(chave, { colaborador: chave, passagensEtapa: 0, tarefasIds: new Set() });
      }
      const entrada = mapa.get(chave);
      entrada.passagensEtapa += 1;
      if (item.tarefaId != null) entrada.tarefasIds.add(item.tarefaId);
    });

    return Array.from(mapa.values())
      .map((entrada) => ({
        colaborador: entrada.colaborador,
        tarefasDistintas: entrada.tarefasIds.size,
        passagensEtapa: entrada.passagensEtapa,
      }))
      .sort((a, b) => a.colaborador.localeCompare(b.colaborador, 'pt-BR', { sensitivity: 'base' }));
  }, [detalhado]);

  const colunas = aba === 'resumo' ? colunasResumo : colunasDetalhado;
  const linhas = aba === 'resumo' ? resumo : detalhado;
  const reportTitle = `Relatório de Comissão — ${aba === 'resumo' ? 'Resumo por Colaborador' : 'Detalhado'}`;

  const buildFiltersSummary = () => {
    const colaboradorNome =
      colaboradorFilter === 'todos'
        ? null
        : colaboradores.find((c) => c.id === Number(colaboradorFilter))?.nome ?? `#${colaboradorFilter}`;
    const clienteNome =
      clienteFilter === 'todos'
        ? null
        : clientes.find((c) => c.id === Number(clienteFilter))?.nome ?? `#${clienteFilter}`;

    const filters = [
      dataInicioFilter ? `Data início: ${new Date(`${dataInicioFilter}T00:00:00`).toLocaleDateString('pt-BR')}` : null,
      dataFimFilter ? `Data fim: ${new Date(`${dataFimFilter}T00:00:00`).toLocaleDateString('pt-BR')}` : null,
      colaboradorNome ? `Colaborador: ${colaboradorNome}` : null,
      clienteNome ? `Cliente: ${clienteNome}` : null,
    ].filter(Boolean);

    return filters.length > 0 ? filters.join(' | ') : 'Nenhum filtro aplicado';
  };

  const exportToPDF = async () => {
    const doc = new jsPDF();
    const filtersSummary = buildFiltersSummary();
    const body = linhas.map((row) => colunas.map((col) => row[col.id] ?? ''));
    const emissionDate = new Date().toLocaleString('pt-BR');
    const logoDataUrl = await obterLogotipo(systemSettings);
    const footerLines = obterRodapeRelatorio(systemSettings);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const countLine = `Total: ${linhas.length} registro(s)`;
    const filtersLines = doc.splitTextToSize(`Filtros: ${filtersSummary}`, pageWidth - 70);
    const headerEndY = 30 + 6 + filtersLines.length * 6;

    autoTable(doc, {
      head: [colunas.map((c) => c.label)],
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

    doc.save(`relatorio-comissao-${aba}.pdf`);
  };

  const exportToExcel = async () => {
    const filtersSummary = buildFiltersSummary();
    const emissionDate = new Date().toLocaleString('pt-BR');
    const footerLines = obterRodapeRelatorio(systemSettings);

    const headerRows = [
      [reportTitle],
      [`Data de emissão: ${emissionDate}`],
      [`Total: ${linhas.length} registro(s)`],
      [`Filtros: ${filtersSummary}`],
      [],
      colunas.map((c) => c.label),
    ];

    const dataRows = linhas.map((row) => colunas.map((col) => row[col.id] ?? ''));
    const footerRows = [[], ...footerLines.map((line) => [line])];
    const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, ...footerRows]);

    if (colunas.length > 1) {
      const lastColumnIndex = colunas.length - 1;
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumnIndex } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumnIndex } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: lastColumnIndex } },
      ];
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comissão');
    await XLSX.writeFile(workbook, `relatorio-comissao-${aba}.xlsx`);
  };

  if (isLoading) {
    return <div className="p-6">Carregando relatório de comissão...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatório de Comissão</h1>
              <p className="text-muted-foreground">
                Tarefas concluídas no período, por colaborador e etapa — base para cálculo de comissão
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
            </Button>
            <Button className="bg-brand-blue hover:bg-brand-blue-dark flex items-center gap-2" onClick={exportToPDF}>
              <FileText className="h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Data início</Label>
                <Input type="date" value={dataInicioFilter} onChange={(e) => setDataInicioFilter(e.target.value)} />
              </div>
              <div>
                <Label>Data fim</Label>
                <Input type="date" value={dataFimFilter} onChange={(e) => setDataFimFilter(e.target.value)} />
              </div>
              <div>
                <Label>Colaborador</Label>
                <Select value={colaboradorFilter} onValueChange={setColaboradorFilter}>
                  <SelectTrigger><SelectValue placeholder="Colaborador" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {colaboradores.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={clienteFilter} onValueChange={setClienteFilter}>
                  <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={aplicarMesAtual}>Mês atual</Button>
              <Button type="button" variant="outline" size="sm" onClick={aplicarMesAnterior}>Mês anterior</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            type="button"
            variant={aba === 'resumo' ? 'default' : 'outline'}
            className={aba === 'resumo' ? 'bg-brand-blue hover:bg-brand-blue-dark flex items-center gap-2' : 'flex items-center gap-2'}
            onClick={() => setAba('resumo')}
          >
            <Users className="h-4 w-4" /> Resumo por Colaborador
          </Button>
          <Button
            type="button"
            variant={aba === 'detalhado' ? 'default' : 'outline'}
            className={aba === 'detalhado' ? 'bg-brand-blue hover:bg-brand-blue-dark flex items-center gap-2' : 'flex items-center gap-2'}
            onClick={() => setAba('detalhado')}
          >
            <History className="h-4 w-4" /> Detalhado
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{linhas.length} registro(s)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-brand-blue/5">
                    {colunas.map((col) => (
                      <TableHead key={col.id} className="font-semibold text-brand-blue">{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((row, index) => (
                    <TableRow key={aba === 'resumo' ? row.colaborador : row.id ?? index} className="hover:bg-muted/40">
                      {colunas.map((col) => (
                        <TableCell key={col.id}>{row[col.id]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {linhas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={colunas.length} className="text-center text-muted-foreground">
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
