'use client';

import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/layout/table';
import { Label } from '../../../components/ui/form/label';
import { Button } from '../../../components/ui/base/button';
import { Input } from '../../../components/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/form/select';
import { DollarSign, FileSpreadsheet, FileText, Filter, ListChecks } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from '@/utils/exceljs-compat';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../services/configuracoes/api';
import { obterRodapeRelatorio, obterLogotipo } from '../../../services/configuracoes/reportBranding';
import { getHistoricoTarefas } from '../projetos-historico/api/historicoTarefas';
import { getColaboradoresKanban, getClientesKanban } from '../../projetos/kanban/api/kanban';

// Colunas que formam o cabeçalho de cada grupo (cliente / projeto / tarefa)
const colunasGrupo = [
  { id: 'clienteNome', label: 'Cliente' },
  { id: 'projetoTitulo', label: 'Projeto' },
  { id: 'tarefaTitulo', label: 'Tarefa' },
];

// Colunas exibidas em cada linha de passagem de etapa, dentro do grupo
const colunasLinha = [
  { id: 'etapaNome', label: 'Etapa' },
  { id: 'colaboradorNome', label: 'Colaborador' },
  { id: 'dataHoraAcao', label: 'Data/Hora' },
  { id: 'observacao', label: 'Observação' },
];

const todasColunas = [...colunasGrupo, ...colunasLinha];
const reportTitle = 'Relatório de Comissão';

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
  const [selectedColumns, setSelectedColumns] = useState(todasColunas.map((c) => c.id));
  const { data: systemSettings = configuracoesPadrao } = useConfiguracoesSistema();

  // Não filtra por tipo nem por colaborador no servidor: para saber quem ficou com uma etapa
  // é preciso ver TODAS as reatribuições da tarefa (mudanças de etapa e de colaborador), mesmo
  // as de outros colaboradores — filtrar por colaborador aqui perderia justamente os eventos
  // necessários pra reconstruir a atribuição correta (ver `segmentos` abaixo).
  const queryParams = useMemo(
    () => ({
      clienteId: clienteFilter,
      dataInicio: toIsoStartOfDay(dataInicioFilter),
      dataFim: toIsoEndOfDay(dataFimFilter),
    }),
    [clienteFilter, dataInicioFilter, dataFimFilter]
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

  const exibicaoNomeCliente = systemSettings?.exibicaoNomeCliente ?? 'razaoSocial';

  // Cliente vindo do cadastro (id, nome, nomeFantasia) — usado no filtro
  function resolverNomeClienteCadastro(cliente) {
    if (exibicaoNomeCliente === 'nomeFantasia' && cliente.nomeFantasia) return cliente.nomeFantasia;
    return cliente.nome ?? '';
  }

  // Cliente vindo do histórico de tarefas (clienteNome, clienteNomeFantasia) — usado nas linhas do relatório
  function resolverNomeCliente(item) {
    if (exibicaoNomeCliente === 'nomeFantasia' && item.clienteNomeFantasia) return item.clienteNomeFantasia;
    return item.clienteNome ?? 'Sem cliente';
  }

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
        .sort((a, b) => resolverNomeClienteCadastro(a).localeCompare(resolverNomeClienteCadastro(b), 'pt-BR', { sensitivity: 'base' })),
    [clientesRaw, exibicaoNomeCliente]
  );

  // Eventos de mudança de etapa ('E') e de reatribuição de colaborador ('A') de cada tarefa,
  // em ordem cronológica — base para descobrir quem realmente ficou com cada etapa. Quando dois
  // eventos têm o mesmo DataHoraAcao (comuns: atribuição e mudança de etapa gravadas na mesma
  // ação do usuário), o Id (ordem de inserção) desempata — o sistema sempre grava a atribuição
  // antes da mudança de etapa quando as duas acontecem juntas.
  const eventosPorTarefa = useMemo(() => {
    const mapa = new Map();
    (historicoApi.registros ?? [])
      .filter((item) => item.tipo === 'E' || item.tipo === 'A')
      .forEach((item) => {
        if (!mapa.has(item.tarefaId)) mapa.set(item.tarefaId, []);
        mapa.get(item.tarefaId).push({
          id: item.id,
          tipo: item.tipo,
          dataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
          colaboradorId: item.colaboradorId ?? null,
          colaboradorNome: item.colaboradorNome ?? null,
          etapaNome: item.etapaNome ?? '—',
          observacao: item.observacao ?? null,
          clienteNome: resolverNomeCliente(item),
          projetoTitulo: item.projetoTitulo ?? '—',
          tarefaTitulo: item.tarefaTitulo ?? 'Sem título',
        });
      });
    mapa.forEach((eventos) =>
      eventos.sort((a, b) => (a.dataHoraAcao ?? 0) - (b.dataHoraAcao ?? 0) || (a.id ?? 0) - (b.id ?? 0))
    );
    return mapa;
  }, [historicoApi, exibicaoNomeCliente]);

  // Uma linha por passagem de etapa. O ponto-chave (visto direto no código do backend que grava
  // esses eventos, ProjetosController.MoverEtapa): o Colaborador gravado no evento 'E' (Mudança de
  // Etapa) é sempre quem estava responsável na etapa que está sendo DEIXADA (o valor "antes" da
  // troca), não quem está assumindo a nova etapa. Ou seja, cada evento 'E' fecha a etapa anterior
  // e credita ela ao colaborador do PRÓPRIO evento — e abre uma nova etapa, cujo responsável só é
  // conhecido pelos eventos 'A' (atribuição) seguintes, seja o que acompanha a própria mudança de
  // etapa (mesma ação do usuário) ou uma reatribuição avulsa feita depois, já dentro da etapa.
  // A última etapa (ainda "aberta", sem uma próxima mudança de etapa que a feche) é creditada ao
  // último responsável conhecido no fim do período. Passagens sem responsável ficam de fora:
  // relatório é base de cálculo de comissão, sem responsável não há comissão.
  const segmentos = useMemo(() => {
    const resultado = [];
    eventosPorTarefa.forEach((eventos, tarefaId) => {
      let etapaAberta = null; // { etapaNome, dataHoraAcao, ...contexto } — a etapa em andamento
      let colaboradorAtual = null; // último responsável conhecido (atualizado por qualquer evento 'A')

      const fecharEtapa = (colaborador) => {
        if (!etapaAberta || !colaborador?.colaboradorNome) return;
        resultado.push({
          id: `${tarefaId}-${etapaAberta.id}`,
          tarefaId,
          colaboradorId: colaborador.colaboradorId,
          colaboradorNome: colaborador.colaboradorNome,
          etapaNome: etapaAberta.etapaNome,
          rawDataHoraAcao: etapaAberta.dataHoraAcao,
          dataHoraAcao: formatDateTime(etapaAberta.dataHoraAcao),
          observacao: colaborador.observacao ?? ' ',
          clienteNome: etapaAberta.clienteNome,
          projetoTitulo: etapaAberta.projetoTitulo,
          tarefaTitulo: etapaAberta.tarefaTitulo,
        });
      };

      eventos.forEach((evento) => {
        if (evento.tipo === 'A') {
          colaboradorAtual = evento;
          return;
        }
        // evento.tipo === 'E': fecha a etapa em andamento, creditando ao colaborador do PRÓPRIO
        // evento 'E' (quem estava responsável antes desta troca — ver comentário acima)
        fecharEtapa(evento);
        etapaAberta = evento;
      });

      // Etapa ainda aberta no fim do período: credita ao último responsável conhecido
      fecharEtapa(colaboradorAtual);
    });
    return resultado;
  }, [eventosPorTarefa]);

  // Filtro de colaborador aplicado aqui (não no servidor) — depois da reconstrução acima
  const linhas = useMemo(
    () => (colaboradorFilter === 'todos' ? segmentos : segmentos.filter((s) => s.colaboradorId === Number(colaboradorFilter))),
    [segmentos, colaboradorFilter]
  );

  // Agrupamento: Cliente > Tarefa, com as passagens de etapa em ordem cronológica dentro de cada tarefa
  const grupos = useMemo(() => {
    const mapa = new Map();
    linhas.forEach((item) => {
      if (!mapa.has(item.tarefaId)) {
        mapa.set(item.tarefaId, {
          tarefaId: item.tarefaId,
          clienteNome: item.clienteNome,
          projetoTitulo: item.projetoTitulo,
          tarefaTitulo: item.tarefaTitulo,
          itens: [],
        });
      }
      mapa.get(item.tarefaId).itens.push(item);
    });

    const lista = Array.from(mapa.values());
    lista.forEach((grupo) => grupo.itens.sort((a, b) => (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0)));
    lista.sort((a, b) => {
      const porCliente = (a.clienteNome ?? '').localeCompare(b.clienteNome ?? '', 'pt-BR', { sensitivity: 'base' });
      if (porCliente !== 0) return porCliente;
      return (a.tarefaTitulo ?? '').localeCompare(b.tarefaTitulo ?? '', 'pt-BR', { sensitivity: 'base' });
    });
    return lista;
  }, [linhas]);

  const colunasLinhaAtivas = colunasLinha.filter((c) => selectedColumns.includes(c.id));
  const numColunasLinha = Math.max(colunasLinhaAtivas.length, 1);

  function buildGroupHeader(grupo) {
    const partes = [];
    if (selectedColumns.includes('clienteNome')) partes.push(grupo.clienteNome);
    if (selectedColumns.includes('projetoTitulo')) partes.push(grupo.projetoTitulo);
    if (selectedColumns.includes('tarefaTitulo')) partes.push(grupo.tarefaTitulo);
    return partes.length > 0 ? partes.join(' — ') : `Tarefa #${grupo.tarefaId}`;
  }

  const toggleColumn = (id) => {
    setSelectedColumns((prev) => (prev.includes(id) ? prev.filter((col) => col !== id) : [...prev, id]));
  };

  const buildFiltersSummary = () => {
    const colaboradorNome =
      colaboradorFilter === 'todos'
        ? null
        : colaboradores.find((c) => c.id === Number(colaboradorFilter))?.nome ?? `#${colaboradorFilter}`;
    const clienteEncontrado = clienteFilter === 'todos' ? null : clientes.find((c) => c.id === Number(clienteFilter));
    const clienteNome =
      clienteFilter === 'todos'
        ? null
        : clienteEncontrado
          ? resolverNomeClienteCadastro(clienteEncontrado)
          : `#${clienteFilter}`;

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
    const emissionDate = new Date().toLocaleString('pt-BR');
    const logoDataUrl = await obterLogotipo(systemSettings);
    const footerLines = obterRodapeRelatorio(systemSettings);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const countLine = `Total: ${linhas.length} passagem(ns) de etapa em ${grupos.length} tarefa(s)`;
    const filtersLines = doc.splitTextToSize(`Filtros: ${filtersSummary}`, pageWidth - 70);
    const headerEndY = 30 + 6 + filtersLines.length * 6;

    const body = [];
    grupos.forEach((grupo) => {
      body.push([
        {
          content: buildGroupHeader(grupo),
          colSpan: numColunasLinha,
          styles: { fontStyle: 'bold', fillColor: [230, 240, 250] },
        },
      ]);
      grupo.itens.forEach((item) => {
        body.push(colunasLinhaAtivas.map((col) => item[col.id] ?? ''));
      });
    });

    autoTable(doc, {
      head: [colunasLinhaAtivas.map((c) => c.label)],
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

    doc.save('relatorio-comissao.pdf');
  };

  const exportToExcel = async () => {
    const filtersSummary = buildFiltersSummary();
    const emissionDate = new Date().toLocaleString('pt-BR');
    const footerLines = obterRodapeRelatorio(systemSettings);

    const headerRows = [
      [reportTitle],
      [`Data de emissão: ${emissionDate}`],
      [`Total: ${linhas.length} passagem(ns) de etapa em ${grupos.length} tarefa(s)`],
      [`Filtros: ${filtersSummary}`],
      [],
      colunasLinhaAtivas.map((c) => c.label),
    ];

    const merges = [];
    if (numColunasLinha > 1) {
      const lastColumnIndex = numColunasLinha - 1;
      merges.push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: lastColumnIndex } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: lastColumnIndex } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: lastColumnIndex } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: lastColumnIndex } }
      );
    }

    const dataRows = [];
    let currentRow = headerRows.length;
    grupos.forEach((grupo) => {
      dataRows.push([buildGroupHeader(grupo)]);
      if (numColunasLinha > 1) {
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: numColunasLinha - 1 } });
      }
      currentRow += 1;
      grupo.itens.forEach((item) => {
        dataRows.push(colunasLinhaAtivas.map((col) => item[col.id] ?? ''));
        currentRow += 1;
      });
    });

    const footerRows = [[], ...footerLines.map((line) => [line])];
    const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, ...footerRows]);
    worksheet['!merges'] = merges;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comissão');
    await XLSX.writeFile(workbook, 'relatorio-comissao.xlsx');
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
                Tarefas concluídas no período, agrupadas por cliente e tarefa, com as etapas e colaboradores responsáveis
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                        <SelectItem key={c.id} value={String(c.id)}>{resolverNomeClienteCadastro(c)}</SelectItem>
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
              {todasColunas.map((col) => (
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
            <CardTitle>
              {linhas.length} passagem(ns) de etapa em {grupos.length} tarefa(s)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-brand-blue/5">
                    {colunasLinhaAtivas.map((col) => (
                      <TableHead key={col.id} className="font-semibold text-brand-blue">{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.map((grupo) => (
                    <Fragment key={grupo.tarefaId}>
                      <TableRow className="bg-brand-blue/10 hover:bg-brand-blue/10">
                        <TableCell colSpan={numColunasLinha} className="font-semibold text-brand-blue">
                          {buildGroupHeader(grupo)}
                        </TableCell>
                      </TableRow>
                      {grupo.itens.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/40">
                          {colunasLinhaAtivas.map((col) => (
                            <TableCell key={col.id}>{item[col.id]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                  {grupos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={numColunasLinha} className="text-center text-muted-foreground">
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
