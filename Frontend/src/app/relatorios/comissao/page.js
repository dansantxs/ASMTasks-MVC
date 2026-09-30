'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/layout/table';
import { Label } from '../../../components/ui/form/label';
import { Button } from '../../../components/ui/base/button';
import { Input } from '../../../components/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/form/select';
import { Combobox } from '../../../components/ui/form/combobox';
import { DollarSign, FileSpreadsheet, FileText, Filter, ListChecks } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from '@/utils/exceljs-compat';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../services/configuracoes/api';
import { obterRodapeRelatorio, obterLogotipo } from '../../../services/configuracoes/reportBranding';
import TourGuia from '../../../components/TourGuia';
import { getHistoricoTarefas } from '../projetos-historico/api/historicoTarefas';
import { getColaboradoresKanban, getClientesKanban, getEtapasKanban } from '../../projetos/kanban/api/kanban';
import { getHistoricoAtendimentos } from '../atendimentos-historico/api/historicoAtendimentos';
import { getAtendimentos } from '../../atendimentos/api/atendimentos';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { ROTULO_RESERVADO, ehEtapaElaboracao } from '../../../utils/situacaoTarefa';

// Colunas que formam o cabeçalho de cada grupo (cliente / projeto / tarefa / descrição)
const colunasGrupo = [
  { id: 'clienteNome', label: 'Cliente' },
  { id: 'projetoTitulo', label: 'Projeto' },
  { id: 'tarefaTitulo', label: 'Tarefa/Atendimento' },
  { id: 'descricao', label: 'Descrição' },
  // Não é uma coluna da tabela: é a linha de tempos abaixo do cabeçalho do item. Fica aqui para
  // poder ser desligada junto com as outras, na tela e nas exportações.
  { id: 'tempos', label: 'Tempos (execução/teste)' },
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

// A etapa "de desenvolvimento" de uma tarefa é identificada pelo NOME da etapa cadastrada. Ela
// define o "Desenvolvedor" — sob quem o item é agrupado e quem conta no Resumo por elaboração.
// Para atendimento, o equivalente ao desenvolvedor é quem concluiu.
// Reconhecer pelo nome é frágil a renomeações: se as etapas mudarem de nome, ajuste o padrão
// abaixo. Já a etapa de teste (o "Aprovador" do item e o Resumo por teste) vem da flag
// "Etapa de Teste" do cadastro, que não depende do nome.
const ehEtapaDesenvolvimento = (nome) => /desenvolv|elabora/i.test(nome ?? '');

const SEM_DESENVOLVEDOR = 'Sem desenvolvedor';
// Primeira linha de todo item: quem lançou a tarefa/atendimento. Não é uma etapa cadastrada —
// é uma linha sintética montada a partir de quem cadastrou. Aparece como "Atendimento" porque é
// isso que ela representa no vocabulário da equipe: quem recebeu a demanda do cliente e a lançou.
const ETAPA_LANCAMENTO = 'Atendimento';
const ETAPA_ATENDIMENTO_CONCLUIDO = 'Atendimento Concluído';

// Ordenação dos itens (tarefas/atendimentos) DENTRO de cada colaborador. A ordem entre
// colaboradores é sempre alfabética; aqui só se escolhe a chave principal (a outra vira desempate).
const ordensSecundarias = [
  { id: 'cliente', label: 'Cliente' },
  { id: 'data', label: 'Data' },
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

// Período padrão do relatório: o último mês COMPLETO (o anterior ao atual). Logo depois da virada
// do mês, o que interessa pra comissão é o mês que fechou, não o que mal começou.
function ultimoMesCompleto(data) {
  return {
    inicio: new Date(data.getFullYear(), data.getMonth() - 1, 1),
    fim: new Date(data.getFullYear(), data.getMonth(), 0), // dia 0 do mês atual = último dia do anterior
  };
}

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

const compararTexto = (a, b) =>
  (a ?? '').localeCompare(b ?? '', 'pt-BR', { sensitivity: 'base' });

// Tempo de execução e de teste, como no relatório do sistema antigo. O PREVISTO é o que está
// cadastrado na tarefa (valor + unidade D/H/M); o REALIZADO vem do backend em minutos, somado de
// todo o histórico da tarefa — inclusive o que aconteceu antes do período consultado.
const MINUTOS_POR_UNIDADE = { D: 1440, H: 60, M: 1 };

const previstoEmMinutos = (valor, unidade) => (valor ? valor * (MINUTOS_POR_UNIDADE[unidade] ?? 60) : 0);

function formatarMinutos(minutos) {
  if (!minutos) return null;
  if (minutos < 60) return `${minutos}min`;
  const horas = Math.floor(minutos / 60);
  const restoMin = minutos % 60;
  if (horas < 24) return restoMin ? `${horas}h ${restoMin}min` : `${horas}h`;
  const dias = Math.floor(horas / 24);
  const restoHoras = horas % 24;
  return restoHoras ? `${dias}d ${restoHoras}h` : `${dias}d`;
}

/** "2h 15min (prev. 3h)" — omite a parte que não existe. */
function formatarTempoComPrevisto(minutosRealizados, minutosPrevistos) {
  const realizado = formatarMinutos(minutosRealizados);
  const previsto = formatarMinutos(minutosPrevistos);
  if (!realizado && !previsto) return null;
  if (!previsto) return realizado;
  if (!realizado) return `prev. ${previsto}`;
  return `${realizado} (prev. ${previsto})`;
}

export default function RelatorioComissaoPage() {
  const hoje = new Date();
  const periodoPadrao = ultimoMesCompleto(hoje);
  const [dataInicioFilter, setDataInicioFilter] = useState(() => paraInputDate(periodoPadrao.inicio));
  const [dataFimFilter, setDataFimFilter] = useState(() => paraInputDate(periodoPadrao.fim));
  const [colaboradorFilter, setColaboradorFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [aprovadorFilter, setAprovadorFilter] = useState('todos'); // colaborador da etapa de teste
  const [tipoItemFilter, setTipoItemFilter] = useState('todos'); // todos | tarefa | atendimento | teste
  const [selectedColumns, setSelectedColumns] = useState(todasColunas.map((c) => c.id));
  // Agrupamento: por Colaborador(Desenvolvedor), ou por quem testou quando o Tipo é "Teste";
  // só a ordenação secundária dos itens é ajustável.
  const [sortConfig, setSortConfig] = useState({ ordem: 'cliente', direction: 'asc' });
  const [viewMode, setViewMode] = useState('detalhado'); // detalhado | resumo
  const [totalizarPor, setTotalizarPor] = useState('elaboracao'); // elaboracao | teste — só no Resumo
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
  // Espera o filtro parar de mudar por um instante antes de buscar — evita disparar uma busca a
  // cada tecla digitada (nas datas, isso também dava tempo pro ano ficar completo antes de valer).
  const queryParamsDebounced = useDebouncedValue(queryParams, 400);

  const { data: historicoApi = { registros: [], totalTarefas: 0 }, isLoading: isLoadingTarefas } = useQuery({
    queryKey: ['relatorio-comissao', queryParamsDebounced],
    queryFn: () => getHistoricoTarefas(queryParamsDebounced),
  });

  // Atendimentos também contam pra comissão. Diferente de tarefa, não têm etapas — só um evento
  // de conclusão ('C' = marcado como Realizado). Busca só as conclusões do período; a lista de
  // colaboradores atribuídos de cada uma vem de `atendimentosTodos` logo abaixo.
  const atendimentosQueryParams = useMemo(
    () => ({
      tipo: 'C',
      clienteId: queryParamsDebounced.clienteId,
      dataInicio: queryParamsDebounced.dataInicio,
      dataFim: queryParamsDebounced.dataFim,
    }),
    [queryParamsDebounced]
  );

  const { data: historicoAtendimentosApi = [], isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['relatorio-comissao-atendimentos-historico', atendimentosQueryParams],
    queryFn: () => getHistoricoAtendimentos(atendimentosQueryParams),
  });

  // Lista completa de atendimentos (sem filtro de período — o filtro de período já foi aplicado
  // acima, no histórico de conclusões) só pra pegar colaboradoresIds, já que o evento de conclusão
  // registra apenas quem clicou em "concluir", não todos os atribuídos ao atendimento.
  const { data: atendimentosTodos = [] } = useQuery({
    queryKey: ['relatorio-comissao-atendimentos-todos'],
    queryFn: () => getAtendimentos(),
  });

  const isLoading = isLoadingTarefas || isLoadingAtendimentos;

  const { data: colaboradoresRaw = [] } = useQuery({
    queryKey: ['relatorio-comissao-colaboradores'],
    queryFn: getColaboradoresKanban,
  });

  const { data: clientesRaw = [] } = useQuery({
    queryKey: ['relatorio-comissao-clientes'],
    queryFn: getClientesKanban,
  });

  const { data: etapasRaw = [] } = useQuery({
    queryKey: ['relatorio-comissao-etapas'],
    queryFn: getEtapasKanban,
  });

  // Etapa marcada como final (Configurações > Etapas) — só entram no relatório as tarefas cuja
  // última etapa conhecida no período é essa (comissão só faz sentido pra trabalho já concluído).
  const etapaFinalId = useMemo(() => etapasRaw.find((e) => e.ehEtapaFinal)?.id ?? null, [etapasRaw]);

  // Etapas marcadas como Etapa de Teste — de onde sai o "Aprovador" de cada tarefa.
  const etapaTesteIds = useMemo(
    () => new Set(etapasRaw.filter((e) => e.ehEtapaTeste).map((e) => e.id)),
    [etapasRaw]
  );

  // Nome da etapa de elaboração como está no cadastro, para a linha deduzida usar o mesmo
  // vocabulário das demais. Sem etapa cadastrada, fica o termo genérico.
  const nomeEtapaElaboracao = useMemo(
    () => etapasRaw.find((e) => ehEtapaDesenvolvimento(e.nome))?.nome ?? 'Elaboração',
    [etapasRaw]
  );

  // Ordem das etapas como estão cadastradas no fluxo. As linhas de cada item são exibidas
  // nessa ordem, e não na cronológica: como fica só a última passagem por etapa, uma tarefa que
  // voltou da aprovação para a elaboração mostraria a elaboração depois da aprovação.
  const ordemPorEtapaId = useMemo(
    () => new Map(etapasRaw.map((e) => [e.id, e.ordem ?? 0])),
    [etapasRaw]
  );
  const ordemEtapaElaboracao = useMemo(
    () => etapasRaw.find((e) => ehEtapaDesenvolvimento(e.nome))?.ordem ?? 0,
    [etapasRaw]
  );

  // Lugar de cada linha no fluxo. As linhas sintéticas não têm etapa cadastrada: o lançamento
  // abre o item, o Reservado encosta na elaboração que antecede, e a elaboração deduzida ocupa
  // o lugar da própria elaboração. Etapa que saiu do cadastro vai para o fim.
  const ordemDaLinha = (item) => {
    if (item.etapaId != null) return ordemPorEtapaId.get(item.etapaId) ?? Number.MAX_SAFE_INTEGER;
    if (item.etapaNome === ETAPA_LANCAMENTO) return Number.MIN_SAFE_INTEGER;
    if (item.etapaNome === ROTULO_RESERVADO) return ordemEtapaElaboracao - 0.5;
    if (item.etapaNome === nomeEtapaElaboracao) return ordemEtapaElaboracao;
    return Number.MAX_SAFE_INTEGER;
  };

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
        .sort((a, b) => compararTexto(a.nome, b.nome)),
    [colaboradoresRaw]
  );
  const clientes = useMemo(
    () =>
      clientesRaw
        .filter((c) => c.ativo !== false)
        .sort((a, b) => compararTexto(resolverNomeClienteCadastro(a), resolverNomeClienteCadastro(b))),
    [clientesRaw, exibicaoNomeCliente]
  );

  const colaboradorNomePorId = useMemo(
    () => new Map(colaboradoresRaw.map((c) => [c.id, c.nome])),
    [colaboradoresRaw]
  );
  const clientePorId = useMemo(() => new Map(clientesRaw.map((c) => [c.id, c])), [clientesRaw]);
  const atendimentoPorId = useMemo(() => new Map(atendimentosTodos.map((a) => [a.id, a])), [atendimentosTodos]);

  // Contexto por tarefa que não varia entre os eventos do histórico (quem lançou, quando, e a
  // descrição da tarefa) — vem replicado em todo registro, então basta o primeiro visto.
  const infoPorTarefa = useMemo(() => {
    const mapa = new Map();
    (historicoApi.registros ?? []).forEach((r) => {
      if (mapa.has(r.tarefaId)) return;
      mapa.set(r.tarefaId, {
        lancadoPorColaboradorId: r.cadastradoPorColaboradorId ?? null,
        lancadoPorNome: r.cadastradoPorNome ?? null,
        lancadoPorData: r.tarefaDataCadastro ? new Date(r.tarefaDataCadastro) : null,
        descricao: r.tarefaDescricao ?? null,
        execucaoPrevistaMin: previstoEmMinutos(r.tempoExecucaoValor, r.tempoExecucaoUnidade),
        testePrevistoMin: previstoEmMinutos(r.tempoTesteValor, r.tempoTesteUnidade),
        execucaoRealizadaMin: r.minutosElaboracao ?? 0,
        testeRealizadoMin: r.minutosTeste ?? 0,
      });
    });
    return mapa;
  }, [historicoApi]);

  // Uma linha "Atendimento Concluído" por atendimento concluído no período (Status ainda 'R' — se
  // foi reaberto depois, não conta). Diferente de tarefa, não tem etapas; o crédito da comissão é
  // de quem concluiu (concluidoPor*). Os demais colaboradores atribuídos ficam só em
  // `participantesIds`, usado como reserva quando não se sabe quem concluiu.
  const linhasAtendimento = useMemo(() => {
    const resultado = [];
    const atendimentosVistos = new Set();

    historicoAtendimentosApi
      .filter((evento) => evento.tipo === 'C' && evento.atendimentoStatusAtual === 'R')
      .forEach((evento) => {
        if (atendimentosVistos.has(evento.atendimentoId)) return; // só a 1ª conclusão no período
        atendimentosVistos.add(evento.atendimentoId);

        const atendimento = atendimentoPorId.get(evento.atendimentoId);
        const participantesIds = atendimento?.colaboradoresIds?.length
          ? atendimento.colaboradoresIds
          : evento.colaboradorId
            ? [evento.colaboradorId]
            : [];
        const dataConclusao = atendimento?.dataHoraConclusao
          ? new Date(atendimento.dataHoraConclusao)
          : evento.dataHoraAcao
            ? new Date(evento.dataHoraAcao)
            : null;
        const cliente = clientePorId.get(evento.clienteId);
        const clienteNome = cliente ? resolverNomeClienteCadastro(cliente) : evento.clienteNome ?? 'Sem cliente';

        const concluidoPorId = atendimento?.concluidoPorColaboradorId ?? evento.colaboradorId ?? null;
        const concluidoPorNome =
          colaboradorNomePorId.get(concluidoPorId) ?? evento.colaboradorNome ?? 'Sem responsável';

        resultado.push({
          id: `atendimento-${evento.atendimentoId}`,
          itemTipo: 'atendimento',
          tarefaId: `atendimento-${evento.atendimentoId}`,
          colaboradorId: concluidoPorId,
          colaboradorNome: concluidoPorNome,
          etapaId: null,
          etapaNome: ETAPA_ATENDIMENTO_CONCLUIDO,
          rawDataHoraAcao: dataConclusao,
          dataHoraAcao: formatDateTime(dataConclusao),
          observacao: atendimento?.observacaoConclusao ?? evento.observacao ?? ' ',
          clienteNome,
          projetoTitulo: '—',
          tarefaTitulo: evento.atendimentoTitulo ?? 'Sem título',
          descricao: atendimento?.descricao ?? null,
          concluidoPorId,
          concluidoPorNome,
          participantesIds,
          lancadoPorColaboradorId: atendimento?.cadastradoPorColaboradorId ?? null,
          lancadoPorNome: colaboradorNomePorId.get(atendimento?.cadastradoPorColaboradorId) ?? null,
          lancadoPorData: atendimento?.dataCadastro ? new Date(atendimento.dataCadastro) : null,
        });
      });

    return resultado;
  }, [historicoAtendimentosApi, atendimentoPorId, colaboradorNomePorId, clientePorId, exibicaoNomeCliente]);

  // Eventos de mudança de etapa ('E') e de reatribuição de colaborador ('A') de cada tarefa,
  // em ordem cronológica — base para descobrir quem realmente ficou com cada etapa. Quando dois
  // eventos têm o mesmo DataHoraAcao (comuns: atribuição e mudança de etapa gravadas na mesma
  // ação do usuário), o Id (ordem de inserção) desempata — o sistema sempre grava a atribuição
  // antes da mudança de etapa quando as duas acontecem juntas.
  const eventosPorTarefa = useMemo(() => {
    const mapa = new Map();
    (historicoApi.registros ?? [])
      .filter((item) => item.tipo === 'E' || item.tipo === 'A' || item.tipo === 'I')
      .forEach((item) => {
        if (!mapa.has(item.tarefaId)) mapa.set(item.tarefaId, []);
        mapa.get(item.tarefaId).push({
          id: item.id,
          tipo: item.tipo,
          dataHoraAcao: item.dataHoraAcao ? new Date(item.dataHoraAcao) : null,
          colaboradorId: item.colaboradorId ?? null,
          colaboradorNome: item.colaboradorNome ?? null,
          etapaId: item.etapaId ?? null,
          etapaNome: item.etapaNome ?? '—',
          elaboracaoJaIniciadaNoEvento: !!item.elaboracaoJaIniciadaNoEvento,
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

        // Elaboração que ficou reservada antes de começar: o período entre a entrada na etapa e
        // o início vira uma linha "Reservado", e a linha da elaboração passa a contar do início.
        const inicio = etapaAberta.inicioElaboracao;
        if (inicio) {
          const reservadoPor = etapaAberta.reservadoPor?.colaboradorNome ? etapaAberta.reservadoPor : colaborador;
          resultado.push({
            id: `${tarefaId}-${etapaAberta.id}-reservado`,
            itemTipo: 'tarefa',
            tarefaId,
            colaboradorId: reservadoPor.colaboradorId,
            colaboradorNome: reservadoPor.colaboradorNome,
            etapaId: null,
            etapaNome: ROTULO_RESERVADO,
            rawDataHoraAcao: etapaAberta.dataHoraAcao,
            dataHoraAcao: formatDateTime(etapaAberta.dataHoraAcao),
            observacao: ' ',
            clienteNome: etapaAberta.clienteNome,
            projetoTitulo: etapaAberta.projetoTitulo,
            tarefaTitulo: etapaAberta.tarefaTitulo,
          });
        }
        const dataElaboracao = inicio?.dataHoraAcao ?? etapaAberta.dataHoraAcao;

        resultado.push({
          id: `${tarefaId}-${etapaAberta.id}`,
          itemTipo: 'tarefa',
          tarefaId,
          colaboradorId: colaborador.colaboradorId,
          colaboradorNome: colaborador.colaboradorNome,
          etapaId: etapaAberta.etapaId,
          etapaNome: etapaAberta.etapaNome,
          rawDataHoraAcao: dataElaboracao,
          dataHoraAcao: formatDateTime(dataElaboracao),
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
        if (evento.tipo === 'I') {
          // Primeiro início de uma elaboração que entrou reservada; reinícios após pausa não contam.
          if (etapaAberta?.reservada && !etapaAberta.inicioElaboracao) {
            etapaAberta.inicioElaboracao = evento;
            etapaAberta.reservadoPor = colaboradorAtual;
          }
          return;
        }
        // evento.tipo === 'E': fecha a etapa em andamento, creditando ao colaborador do PRÓPRIO
        // evento 'E' (quem estava responsável antes desta troca — ver comentário acima)
        fecharEtapa(evento);
        etapaAberta = {
          ...evento,
          reservada: ehEtapaElaboracao(evento.etapaNome) && !evento.elaboracaoJaIniciadaNoEvento,
        };
      });

      // Etapa ainda aberta no fim do período: credita ao último responsável conhecido
      fecharEtapa(colaboradorAtual);
    });
    return resultado;
  }, [eventosPorTarefa]);

  // Tarefas cuja última etapa conhecida no período é a etapa final — calculado a partir de
  // `segmentos` (não filtrado por colaborador ainda), já que o último segmento de uma tarefa pode
  // ter ficado com um colaborador diferente do que está selecionado no filtro.
  const tarefasFinalizadas = useMemo(() => {
    if (!etapaFinalId) return null; // nenhuma etapa marcada como final: não filtra
    const ultimaEtapaPorTarefa = new Map();
    segmentos.forEach((segmento) => ultimaEtapaPorTarefa.set(segmento.tarefaId, segmento.etapaId));
    const set = new Set();
    ultimaEtapaPorTarefa.forEach((etapaId, tarefaId) => {
      if (etapaId === etapaFinalId) set.add(tarefaId);
    });
    return set;
  }, [segmentos, etapaFinalId]);

  // Junta tarefas e atendimentos numa lista só — cada linha já carrega itemTipo, então o resto do
  // relatório trata os dois de forma uniforme. O filtro de colaborador NÃO é aplicado aqui: ele
  // define quais itens aparecem (aqueles creditados a ele), mas todas as etapas do item
  // continuam visíveis (ver `grupos`).
  const linhasTarefasEAtendimentos = useMemo(
    () => [...segmentos, ...linhasAtendimento],
    [segmentos, linhasAtendimento]
  );

  // Agrupamento base: um grupo por tarefa/atendimento. Dentro do grupo, as passagens em ordem
  // cronológica, com:
  //   - a linha de lançamento ("Atendimento") como primeira linha das tarefas;
  //   - etapas DUPLICADAS reduzidas à última ocorrência (uma etapa reaberta várias vezes aparece
  //     só na passagem mais recente);
  //   - o "Desenvolvedor" do item: para tarefa, o colaborador da última etapa cujo nome contém
  //     "desenvolv"; para atendimento, quem concluiu.
  // "Teste" não é um tipo de item: é a mesma lista de tarefas vista por outro ângulo — o crédito
  // de cada uma passa a ser de quem fez a etapa de teste, em vez de quem elaborou. É isso que
  // muda o agrupamento, a ordenação e o Resumo, que leem esse mesmo crédito.
  const creditoPorTeste = tipoItemFilter === 'teste';
  const tipoItemBase = creditoPorTeste ? 'tarefa' : tipoItemFilter;
  const creditoDoGrupo = (grupo) =>
    creditoPorTeste
      ? { id: grupo.aprovadorId, nome: grupo.aprovadorNome }
      : { id: grupo.desenvolvedorId, nome: grupo.desenvolvedorNome };

  const grupos = useMemo(() => {
    const mapa = new Map();

    linhasTarefasEAtendimentos
      .filter((item) => item.itemTipo === 'atendimento' || !tarefasFinalizadas || tarefasFinalizadas.has(item.tarefaId))
      .filter((item) => tipoItemBase === 'todos' || item.itemTipo === tipoItemBase)
      .forEach((item) => {
        if (!mapa.has(item.tarefaId)) {
          mapa.set(item.tarefaId, {
            tarefaId: item.tarefaId,
            itemTipo: item.itemTipo,
            clienteNome: item.clienteNome,
            projetoTitulo: item.projetoTitulo,
            tarefaTitulo: item.tarefaTitulo,
            itens: [],
          });
        }
        mapa.get(item.tarefaId).itens.push(item);
      });

    const lista = Array.from(mapa.values());

    lista.forEach((grupo) => {
      // Ordem cronológica das etapas dentro do grupo não é configurável — é o que dá sentido à
      // sequência (quem pegou depois de quem).
      grupo.itens.sort((a, b) => (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0));

      // Item 5: remove etapas duplicadas, mantendo só a última ocorrência de cada etapa.
      if (grupo.itemTipo === 'tarefa') {
        const ultimaPorEtapa = new Map();
        grupo.itens.forEach((item) => {
          const chave = item.etapaId ?? item.etapaNome;
          ultimaPorEtapa.set(chave, item); // itens já ordenados: o último sobrescreve
        });
        grupo.itens = Array.from(ultimaPorEtapa.values()).sort(
          (a, b) => (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0)
        );
      }

      const info = grupo.itemTipo === 'tarefa' ? infoPorTarefa.get(grupo.tarefaId) : null;

      // Descrição do item (não varia entre as etapas).
      grupo.descricao =
        grupo.itemTipo === 'tarefa'
          ? info?.descricao ?? null
          : grupo.itens.find((i) => i.descricao)?.descricao ?? null;

      // Tempos só existem para tarefa; atendimento não tem execução nem teste cadastrados.
      grupo.execucaoPrevistaMin = info?.execucaoPrevistaMin ?? 0;
      grupo.testePrevistoMin = info?.testePrevistoMin ?? 0;
      grupo.execucaoRealizadaMin = info?.execucaoRealizadaMin ?? 0;
      grupo.testeRealizadoMin = info?.testeRealizadoMin ?? 0;

      // Desenvolvedor do item — calculado antes de injetar a linha de lançamento.
      if (grupo.itemTipo === 'atendimento') {
        const ref = grupo.itens.find((i) => i.etapaNome === ETAPA_ATENDIMENTO_CONCLUIDO) ?? grupo.itens[0];
        // Quem concluiu é o crédito. Faltando o registro, cai no colaborador atribuído ao
        // atendimento — é quem o atendeu, e sem isso o item ficaria sem ninguém.
        const atribuido = ref?.participantesIds?.find((id) => id != null) ?? null;
        grupo.desenvolvedorId = ref?.concluidoPorId ?? atribuido;
        grupo.desenvolvedorNome =
          ref?.concluidoPorId != null
            ? ref.concluidoPorNome
            : colaboradorNomePorId.get(atribuido) ?? SEM_DESENVOLVEDOR;
      } else {
        // Caminho normal: quem fez a última passagem pela etapa de elaboração. Só vale passagem
        // com responsável: etapa sem ninguém não credita comissão a ninguém.
        const temResponsavel = (item) => item?.colaboradorId != null;
        const etapaDev = [...grupo.itens]
          .reverse()
          .find((item) => ehEtapaDesenvolvimento(item.etapaNome) && temResponsavel(item));

        // Nem toda tarefa passa pela elaboração: parte é resolvida direto em outra etapa (análise,
        // atualização) ou vai de Atendimento para a final. Sem fallback, essas caíam todas em
        // "Sem desenvolvedor" e sumiam da contagem, embora o histórico mostre quem fez.
        // Cascata: quem estava na etapa anterior à final; se foi direto para a final, quem estava
        // nela. Só sobra "Sem desenvolvedor" quando não há responsável em passagem nenhuma.
        const etapasPercorridas = [...grupo.itens].reverse();
        const referencia =
          etapaDev ??
          etapasPercorridas.find((item) => item.etapaId !== etapaFinalId && temResponsavel(item)) ??
          etapasPercorridas.find(temResponsavel) ??
          null;

        grupo.desenvolvedorId = referencia?.colaboradorId ?? null;
        grupo.desenvolvedorNome = referencia?.colaboradorNome ?? SEM_DESENVOLVEDOR;

        // Guarda de onde veio o crédito para montar, mais abaixo, a linha de elaboração — sem
        // ela o item fica sem a etapa que justifica a comissão de quem o fez.
        grupo.elaboracaoDeduzidaDe = !etapaDev && referencia?.colaboradorId != null ? referencia : null;
      }

      // Aprovador do item: colaborador da última passagem pela etapa de teste. Só tarefa —
      // atendimento não tem etapas.
      const etapaAprovacao =
        grupo.itemTipo === 'tarefa'
          ? [...grupo.itens].reverse().find((item) => etapaTesteIds.has(item.etapaId))
          : null;
      grupo.aprovadorId = etapaAprovacao?.colaboradorId ?? null;
      grupo.aprovadorNome = etapaAprovacao?.colaboradorNome ?? null;

      // Colaboradores que participaram do item: quem fez alguma etapa dela, quem a lançou e, no
      // atendimento, quem está atribuído. Não decide quais itens aparecem — isso é do crédito —;
      // serve de reserva para achar um responsável quando o item não aponta um.
      const participantes = new Set(
        grupo.itens.map((item) => item.colaboradorId).filter((id) => id != null)
      );

      // Itens 3 e 5: linha de lançamento ("Atendimento") como primeira do grupo (tarefa e atendimento).
      const base = grupo.itens[0];
      (base?.participantesIds ?? []).forEach((id) => participantes.add(id));
      const lancado =
        grupo.itemTipo === 'tarefa'
          ? info && (info.lancadoPorNome || info.lancadoPorData)
            ? { id: info.lancadoPorColaboradorId, nome: info.lancadoPorNome, data: info.lancadoPorData }
            : null
          : base && (base.lancadoPorNome || base.lancadoPorData)
            ? { id: base.lancadoPorColaboradorId, nome: base.lancadoPorNome, data: base.lancadoPorData }
            : null;
      if (lancado) {
        if (lancado.id != null) participantes.add(lancado.id);
        grupo.itens.unshift({
          id: `${grupo.tarefaId}-lancamento`,
          itemTipo: grupo.itemTipo,
          tarefaId: grupo.tarefaId,
          colaboradorId: lancado.id,
          colaboradorNome: lancado.nome ?? 'Sem responsável',
          etapaId: null,
          etapaNome: ETAPA_LANCAMENTO,
          rawDataHoraAcao: lancado.data,
          dataHoraAcao: formatDateTime(lancado.data),
          observacao: ' ',
          clienteNome: grupo.clienteNome,
          projetoTitulo: grupo.projetoTitulo,
          tarefaTitulo: grupo.tarefaTitulo,
          descricao: grupo.descricao,
        });
      }

      // Tarefa que não passou pela elaboração: o trabalho aconteceu em outra etapa (análise,
      // atualização) ou entre a abertura e a conclusão. A linha de elaboração é montada aqui,
      // com quem foi creditado, para o item mostrar a etapa que justifica a comissão. A etapa
      // real de onde veio o crédito continua na lista, logo acima — nada do histórico some.
      const deduzida = grupo.elaboracaoDeduzidaDe;
      if (deduzida) {
        const linhaElaboracao = {
          id: `${grupo.tarefaId}-elaboracao-deduzida`,
          itemTipo: grupo.itemTipo,
          tarefaId: grupo.tarefaId,
          colaboradorId: deduzida.colaboradorId,
          colaboradorNome: deduzida.colaboradorNome,
          etapaId: null,
          etapaNome: nomeEtapaElaboracao,
          rawDataHoraAcao: deduzida.rawDataHoraAcao,
          dataHoraAcao: deduzida.dataHoraAcao,
          observacao: `Sem passagem pela elaboração — creditado pela etapa ${deduzida.etapaNome}`,
          clienteNome: grupo.clienteNome,
          projetoTitulo: grupo.projetoTitulo,
          tarefaTitulo: grupo.tarefaTitulo,
          descricao: grupo.descricao,
        };
        // Entra antes da etapa final, que é onde a elaboração termina; sem etapa final na lista,
        // vai para o fim.
        const posicaoFinal = grupo.itens.findIndex((item) => item.etapaId === etapaFinalId);
        if (posicaoFinal >= 0) grupo.itens.splice(posicaoFinal, 0, linhaElaboracao);
        else grupo.itens.push(linhaElaboracao);
      }

      grupo.participantesIds = participantes;

      // Data de conclusão do item = a mais recente das passagens. Tem de ser o máximo, e não a
      // última linha, porque a ordem de exibição segue o fluxo e não o relógio.
      grupo.dataConclusao = grupo.itens.reduce(
        (maior, item) => (item.rawDataHoraAcao > (maior ?? 0) ? item.rawDataHoraAcao : maior),
        null
      );

      // Exibição na ordem do fluxo; entre linhas da mesma etapa, a mais antiga primeiro.
      if (grupo.itemTipo === 'tarefa') {
        grupo.itens.sort(
          (a, b) =>
            ordemDaLinha(a) - ordemDaLinha(b) || (a.rawDataHoraAcao ?? 0) - (b.rawDataHoraAcao ?? 0)
        );
      }
    });

    // Item sem ninguém a creditar (nenhuma passagem teve responsável) fica de fora: o
    // relatório é de comissão, e um item que não rende comissão a ninguém só atrapalharia a
    // conferência. É falha de cadastro da tarefa, não do relatório.
    // Em "Teste", quem não passou pela etapa de teste também fica de fora, pela mesma razão:
    // ninguém a testou, então ela não rende comissão de teste.
    return lista.filter((grupo) => creditoDoGrupo(grupo).id != null);
  }, [linhasTarefasEAtendimentos, tarefasFinalizadas, tipoItemBase, creditoPorTeste, infoPorTarefa, etapaTesteIds, etapaFinalId, nomeEtapaElaboracao, ordemPorEtapaId, ordemEtapaElaboracao, colaboradorNomePorId]);

  const colaboradorIdFiltro = colaboradorFilter === 'todos' ? null : Number(colaboradorFilter);
  const aprovadorIdFiltro = aprovadorFilter === 'todos' ? null : Number(aprovadorFilter);

  // Opções do "Aprovado por": só quem consta como aprovador de algum item do período — não a
  // lista inteira de colaboradores. Sai do mesmo `grupo.aprovadorId` que o filtro compara, então
  // toda opção oferecida devolve pelo menos um item.
  const aprovadoresDisponiveis = useMemo(() => {
    const mapa = new Map();
    grupos.forEach((grupo) => {
      if (grupo.aprovadorId == null || mapa.has(grupo.aprovadorId)) return;
      mapa.set(grupo.aprovadorId, grupo.aprovadorNome ?? `#${grupo.aprovadorId}`);
    });
    return Array.from(mapa, ([id, nome]) => ({ id, nome })).sort((a, b) => compararTexto(a.nome, b.nome));
  }, [grupos]);

  // Trocar o período (ou o tipo) pode tirar da lista o aprovador escolhido. Sem isto o relatório
  // ficaria vazio exibindo um nome que nem está mais entre as opções.
  useEffect(() => {
    if (aprovadorFilter === 'todos') return;
    if (!aprovadoresDisponiveis.some((a) => String(a.id) === aprovadorFilter)) setAprovadorFilter('todos');
  }, [aprovadoresDisponiveis, aprovadorFilter]);

  // "Aprovado por" restringe os ITENS de fato (entra também no Resumo), diferente do filtro de
  // colaborador, que só escolhe quais itens aparecem sem mexer na contagem por colaborador.
  const gruposPorAprovador = useMemo(
    () => (aprovadorIdFiltro == null ? grupos : grupos.filter((grupo) => grupo.aprovadorId === aprovadorIdFiltro)),
    [grupos, aprovadorIdFiltro]
  );

  // O filtro de colaborador seleciona os itens pelo CRÉDITO, não pela participação: entra a tarefa
  // que a pessoa elaborou e o atendimento que ela concluiu. Ter só lançado, testado ou feito uma
  // etapa de atualização não traz o item para a lista dela — é o mesmo critério do Resumo, então a
  // Detalhada e o Resumo mostram sempre o mesmo número. As etapas das outras pessoas continuam
  // visíveis dentro de cada item; muda só quais itens entram.
  const gruposVisiveis = useMemo(() => {
    if (colaboradorIdFiltro == null) return gruposPorAprovador;
    return gruposPorAprovador.filter((grupo) => grupo.desenvolvedorId === colaboradorIdFiltro);
  }, [gruposPorAprovador, colaboradorIdFiltro]);

  // Itens 1 e 2: relatório dividido em seções por quem recebe o crédito do item, cada item numerado
  // dentro da sua seção.
  const secoes = useMemo(() => {
    const comparadorItens = (a, b) => {
      const porCliente = compararTexto(a.clienteNome, b.clienteNome);
      const porData = (a.dataConclusao ?? 0) - (b.dataConclusao ?? 0);
      const base = sortConfig.ordem === 'data' ? porData || porCliente : porCliente || porData;
      return sortConfig.direction === 'asc' ? base : -base;
    };

    const mapa = new Map();
    // Todo item que chega aqui tem crédito — os sem crédito já ficaram de fora em `grupos`. Em
    // "Teste" o crédito é de quem testou, e aí as seções são por testador, mesmo com um colaborador
    // filtrado — o filtro escolhe as tarefas pela elaboração, não pelo agrupamento.
    const chaveSecao = (grupo) => String(creditoDoGrupo(grupo).id);

    gruposVisiveis.forEach((grupo) => {
      const chave = chaveSecao(grupo);
      if (!mapa.has(chave)) {
        const credito = creditoDoGrupo(grupo);
        const nome = credito.nome ?? colaboradorNomePorId.get(credito.id) ?? `#${credito.id}`;
        mapa.set(chave, { chave, colaboradorId: credito.id, nome, grupos: [] });
      }
      mapa.get(chave).grupos.push(grupo);
    });

    const lista = Array.from(mapa.values());
    lista.sort((a, b) => compararTexto(a.nome, b.nome));
    lista.forEach((secao) => {
      secao.grupos.sort(comparadorItens);
      secao.grupos = secao.grupos.map((grupo, idx) => ({ ...grupo, numero: idx + 1 }));
    });
    return lista;
  }, [gruposVisiveis, sortConfig, creditoPorTeste, colaboradorNomePorId]);

  const totalGrupos = useMemo(
    () => secoes.reduce((acc, secao) => acc + secao.grupos.length, 0),
    [secoes]
  );

  // Item 4: contagem por colaborador. Por elaboração: quem fez o desenvolvimento (tarefa) ou
  // concluiu o atendimento. Por teste: quem fez a etapa de teste — só tarefa, atendimento não
  // passa por teste. Respeita período/cliente/tipo/"aprovado por"; o filtro de colaborador só
  // restringe a linha exibida — menos em "Teste", onde ele escolhe as tarefas (ver abaixo).
  const resumoColaboradores = useMemo(() => {
    const porTeste = creditoPorTeste || totalizarPor === 'teste';
    const tally = new Map();
    // Em "Teste" o Resumo soma sobre os mesmos itens da Detalhada: o filtro de colaborador
    // escolhe as tarefas pela elaboração e o total sai por testador, então não dá para filtrar a
    // linha exibida por esse mesmo id — ele é de outra pessoa.
    (creditoPorTeste ? gruposVisiveis : gruposPorAprovador).forEach((grupo) => {
      // Reforça o filtro de tipo aqui (além de `grupos`) pra não sobrar tarefa quando o filtro é
      // "Atendimentos" nem o contrário.
      if (tipoItemBase !== 'todos' && grupo.itemTipo !== tipoItemBase) return;
      if (porTeste && grupo.itemTipo !== 'tarefa') return;
      const id = porTeste ? grupo.aprovadorId : grupo.desenvolvedorId;
      if (id == null) return;
      const nome = porTeste ? grupo.aprovadorNome : grupo.desenvolvedorNome;
      const atual = tally.get(id) ?? { colaboradorId: id, nome, total: 0 };
      atual.total += 1;
      tally.set(id, atual);
    });
    let lista = Array.from(tally.values());
    if (!creditoPorTeste && colaboradorIdFiltro != null) {
      lista = lista.filter((r) => r.colaboradorId === colaboradorIdFiltro);
    }
    lista.sort((a, b) => b.total - a.total || compararTexto(a.nome, b.nome));
    return lista;
  }, [gruposPorAprovador, gruposVisiveis, tipoItemBase, creditoPorTeste, colaboradorIdFiltro, totalizarPor]);

  const rotuloTotalResumo =
    creditoPorTeste || totalizarPor === 'teste'
      ? 'Total (teste)'
      : tipoItemFilter === 'tarefa'
        ? 'Total (desenvolvimento)'
        : tipoItemFilter === 'atendimento'
          ? 'Total (atendimentos concluídos)'
          : 'Total (desenvolvimento + atendimentos)';

  const colunasLinhaAtivas = colunasLinha.filter((c) => selectedColumns.includes(c.id));
  const numColunasLinha = Math.max(colunasLinhaAtivas.length, 1);

  function buildGroupHeader(grupo) {
    const partes = [];
    if (selectedColumns.includes('clienteNome')) partes.push(grupo.clienteNome);
    if (selectedColumns.includes('projetoTitulo')) partes.push(grupo.projetoTitulo);
    if (selectedColumns.includes('tarefaTitulo')) partes.push(grupo.tarefaTitulo);
    if (selectedColumns.includes('descricao') && grupo.descricao?.trim()) partes.push(grupo.descricao.trim());
    const titulo = partes.length > 0 ? partes.join(' — ') : `Tarefa #${grupo.tarefaId}`;
    // Quem aprovou fica no cabeçalho do item, ao lado do que identifica a tarefa.
    const comAprovador = grupo.aprovadorNome ? `${titulo} · Aprovado por: ${grupo.aprovadorNome}` : titulo;

    return grupo.numero ? `${grupo.numero} - ${comAprovador}` : comAprovador;
  }

  /**
   * Tempo de execução e de teste do item: realizado e, entre parênteses, o previsto na tarefa.
   * Fica em linha separada — junto do cabeçalho, se perdia no fim da descrição da tarefa.
   * Devolve null quando o item não tem tempo nenhum (atendimento, por exemplo).
   */
  function buildTemposGrupo(grupo) {
    if (!selectedColumns.includes('tempos')) return null;

    const tempos = [];
    const execucao = formatarTempoComPrevisto(grupo.execucaoRealizadaMin, grupo.execucaoPrevistaMin);
    const teste = formatarTempoComPrevisto(grupo.testeRealizadoMin, grupo.testePrevistoMin);
    if (execucao) tempos.push(`Execução: ${execucao}`);
    if (teste) tempos.push(`Teste: ${teste}`);
    return tempos.length > 0 ? tempos.join(' · ') : null;
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

    const tipoLabel =
      tipoItemFilter === 'tarefa'
        ? 'Tarefas'
        : tipoItemFilter === 'atendimento'
          ? 'Atendimentos'
          : tipoItemFilter === 'teste'
            ? 'Teste (tarefas, por quem testou)'
            : null;

    const aprovadorNome =
      aprovadorFilter === 'todos'
        ? null
        : aprovadoresDisponiveis.find((a) => a.id === Number(aprovadorFilter))?.nome ?? `#${aprovadorFilter}`;

    const filters = [
      dataInicioFilter ? `Data início: ${new Date(`${dataInicioFilter}T00:00:00`).toLocaleDateString('pt-BR')}` : null,
      dataFimFilter ? `Data fim: ${new Date(`${dataFimFilter}T00:00:00`).toLocaleDateString('pt-BR')}` : null,
      tipoLabel ? `Tipo: ${tipoLabel}` : null,
      colaboradorNome ? `Elaborado por: ${colaboradorNome}` : null,
      aprovadorNome ? `Aprovado por: ${aprovadorNome}` : null,
      clienteNome ? `Cliente: ${clienteNome}` : null,
      viewMode === 'resumo'
        ? `Visão: Resumo (total por colaborador, por ${totalizarPor === 'teste' ? 'teste' : 'elaboração'})`
        : null,
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
    const countLine =
      viewMode === 'resumo'
        ? `Total: ${resumoColaboradores.length} colaborador(es)`
        : `Total: ${totalGrupos} item(ns) (tarefas e atendimentos)`;
    const filtersLines = doc.splitTextToSize(`Filtros: ${filtersSummary}`, pageWidth - 70);
    const headerEndY = 30 + 6 + filtersLines.length * 6;

    let head;
    const body = [];
    if (viewMode === 'resumo') {
      head = [['Colaborador', rotuloTotalResumo]];
      resumoColaboradores.forEach((r) => body.push([r.nome, String(r.total)]));
    } else {
      head = [colunasLinhaAtivas.map((c) => c.label)];
      secoes.forEach((secao) => {
        body.push([
          {
            content: `${secao.nome} — ${secao.grupos.length} item(ns)`,
            colSpan: numColunasLinha,
            styles: { fontStyle: 'bold', fillColor: [210, 224, 240] },
          },
        ]);
        secao.grupos.forEach((grupo) => {
          body.push([
            {
              content: buildGroupHeader(grupo),
              colSpan: numColunasLinha,
              styles: { fontStyle: 'bold', fillColor: [230, 240, 250] },
            },
          ]);
          const tempos = buildTemposGrupo(grupo);
          if (tempos) {
            body.push([
              {
                content: tempos,
                colSpan: numColunasLinha,
                styles: { fontStyle: 'italic', fillColor: [243, 248, 253] },
              },
            ]);
          }
          grupo.itens.forEach((item) => {
            body.push(colunasLinhaAtivas.map((col) => item[col.id] ?? ''));
          });
        });
      });
    }

    autoTable(doc, {
      head,
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

    const countLine =
      viewMode === 'resumo'
        ? `Total: ${resumoColaboradores.length} colaborador(es)`
        : `Total: ${totalGrupos} item(ns) (tarefas e atendimentos)`;

    const merges = [];
    const dataRows = [];
    let colunasCabecalho;

    if (viewMode === 'resumo') {
      colunasCabecalho = ['Colaborador', rotuloTotalResumo];
      resumoColaboradores.forEach((r) => dataRows.push([r.nome, r.total]));
    } else {
      colunasCabecalho = colunasLinhaAtivas.map((c) => c.label);
      const larguraLinha = Math.max(colunasCabecalho.length, 1);
      secoes.forEach((secao) => {
        dataRows.push([`${secao.nome} — ${secao.grupos.length} item(ns)`]);
        if (larguraLinha > 1) {
          merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: larguraLinha - 1 }, __rel: dataRows.length - 1 });
        }
        secao.grupos.forEach((grupo) => {
          dataRows.push([buildGroupHeader(grupo)]);
          if (larguraLinha > 1) {
            merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: larguraLinha - 1 }, __rel: dataRows.length - 1 });
          }
          const temposGrupo = buildTemposGrupo(grupo);
          if (temposGrupo) {
            dataRows.push([temposGrupo]);
            if (larguraLinha > 1) {
              merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: larguraLinha - 1 }, __rel: dataRows.length - 1 });
            }
          }
          grupo.itens.forEach((item) => {
            dataRows.push(colunasLinhaAtivas.map((col) => item[col.id] ?? ''));
          });
        });
      });
    }

    const headerRows = [
      [reportTitle],
      [`Data de emissão: ${emissionDate}`],
      [countLine],
      [`Filtros: ${filtersSummary}`],
      [],
      colunasCabecalho,
    ];

    const larguraLinha = Math.max(colunasCabecalho.length, 1);
    const finalMerges = [];
    if (larguraLinha > 1) {
      for (let r = 0; r < 4; r += 1) finalMerges.push({ s: { r, c: 0 }, e: { r, c: larguraLinha - 1 } });
    }
    merges.forEach((m) => {
      const r = headerRows.length + m.__rel;
      finalMerges.push({ s: { r, c: 0 }, e: { r, c: larguraLinha - 1 } });
    });

    const footerRows = [[], ...footerLines.map((line) => [line])];
    const worksheet = XLSX.utils.aoa_to_sheet([...headerRows, ...dataRows, ...footerRows]);
    worksheet['!merges'] = finalMerges;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comissão');
    await XLSX.writeFile(workbook, 'relatorio-comissao.xlsx');
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
            element: '#tour-comissao-cabecalho',
            popover: {
              title: 'Relatório de Comissão',
              description:
                'Base de cálculo da comissão: tarefas que chegaram na etapa final e atendimentos concluídos no período. Cada item aparece sob o <strong>Colaborador(Desenvolvedor)</strong> — quem fez a etapa de desenvolvimento (ou concluiu o atendimento). Em <strong>Tipo: Teste</strong>, as mesmas tarefas aparecem sob quem fez a <strong>etapa de teste</strong>.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-comissao-exportar',
            popover: { title: 'Exportar Dados', description: 'Exporte em <strong>Excel (.xlsx)</strong> ou <strong>PDF</strong> respeitando os filtros, colunas e a visão (Detalhada ou Resumo).', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-comissao-filtros',
            popover: { title: 'Filtros', description: 'Filtre por <strong>período</strong>, <strong>tipo</strong> (Tarefas, Atendimentos ou Teste — este último traz só tarefas, agrupadas e somadas por quem as testou, deixando de fora as que não passaram pelo teste), <strong>elaborado por</strong>, <strong>aprovado por</strong> e <strong>cliente</strong>. <strong>Elaborado por</strong> traz os itens <strong>creditados</strong> à pessoa — a tarefa que ela elaborou e o atendimento que ela concluiu; ter só lançado ou testado não traz o item. Dentro de cada item, as etapas das outras pessoas continuam visíveis. Já <strong>Aprovado por</strong> deixa só os itens cuja etapa de teste foi feita pela pessoa escolhida, e conta também no Resumo; o nome dela aparece no cabeçalho de cada item.', side: 'bottom', align: 'start' },
          },
          {
            element: '#tour-comissao-colunas',
            popover: { title: 'Seleção de Colunas', description: 'Escolha quais colunas aparecem nas linhas de etapa e no cabeçalho de cada item.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-comissao-visao',
            popover: { title: 'Visão e Ordenação', description: '<strong>Detalhada</strong>: todas as etapas de cada item, numeradas por colaborador.<br><strong>Resumo</strong>: o total por colaborador, totalizado por <strong>Elaboração</strong> (desenvolvimento e atendimentos concluídos) ou por <strong>Teste</strong> (quem fez a etapa de teste) — com <strong>Tipo: Teste</strong> o total já sai por testador e esse seletor não aparece, com o <strong>tempo de execução e de teste</strong> somado — realizado (pelo histórico) e previsto (cadastrado na tarefa).<br>A ordem dos itens dentro do colaborador pode ser <strong>Cliente → Data</strong> ou <strong>Data → Cliente</strong>.', side: 'bottom', align: 'end' },
          },
          {
            element: '#tour-comissao-tabela',
            popover: { title: 'Resultados', description: 'Seções por colaborador, cada item numerado (1, 2, 3…). A linha <strong>Atendimento</strong> (quem lançou) abre cada tarefa. Etapas repetidas aparecem só na ocorrência mais recente.', side: 'top', align: 'center' },
          },
        ].filter((p) => !p.element || document.querySelector(p.element)),
      });
      tour.drive();
    });
  }, []);

  // Não retorna cedo em isLoading: isso desmontaria os campos de filtro (incluindo os de data) a
  // cada busca — inclusive as disparadas por cada tecla digitada — fazendo o campo perder o foco.
  // O carregamento é sinalizado dentro da tabela de resultados, mantendo os filtros montados.
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div id="tour-comissao-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Relatório de Comissão</h1>
              <p className="text-muted-foreground">
                {creditoPorTeste
                  ? 'Tarefas concluídas no período, agrupadas por quem fez a etapa de teste, com as etapas percorridas e os responsáveis'
                  : 'Tarefas e atendimentos concluídos no período, agrupados por Colaborador(Desenvolvedor), com as etapas percorridas e os responsáveis'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-comissao-exportar" className="flex items-center gap-3">
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" /> Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div id="tour-comissao-filtros" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Data início</Label>
                  <Input type="date" value={dataInicioFilter} onChange={(e) => setDataInicioFilter(e.target.value)} />
                </div>
                <div>
                  <Label>Data fim</Label>
                  <Input type="date" value={dataFimFilter} onChange={(e) => setDataFimFilter(e.target.value)} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipoItemFilter} onValueChange={setTipoItemFilter}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="tarefa">Tarefas</SelectItem>
                      <SelectItem value="atendimento">Atendimentos</SelectItem>
                      <SelectItem value="teste">Teste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Elaborado por</Label>
                  <Combobox
                    value={colaboradorFilter}
                    onValueChange={setColaboradorFilter}
                    placeholder="Elaborado por"
                    searchPlaceholder="Buscar colaborador..."
                    options={[
                      { value: 'todos', label: 'Todos' },
                      ...colaboradores.map((c) => ({ value: String(c.id), label: c.nome })),
                    ]}
                  />
                </div>
                <div>
                  <Label>Aprovado por</Label>
                  <Combobox
                    value={aprovadorFilter}
                    onValueChange={setAprovadorFilter}
                    placeholder="Aprovado por"
                    searchPlaceholder="Buscar colaborador..."
                    options={[
                      { value: 'todos', label: 'Todos' },
                      ...aprovadoresDisponiveis.map((a) => ({ value: String(a.id), label: a.nome })),
                    ]}
                  />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Combobox
                    value={clienteFilter}
                    onValueChange={setClienteFilter}
                    placeholder="Cliente"
                    searchPlaceholder="Buscar cliente..."
                    options={[
                      { value: 'todos', label: 'Todos' },
                      ...clientes.map((c) => ({ value: String(c.id), label: resolverNomeClienteCadastro(c) })),
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> Colunas</CardTitle>
            </CardHeader>
            <CardContent id="tour-comissao-colunas" className="grid grid-cols-2 gap-2">
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
            <CardTitle className="flex items-center justify-between flex-wrap gap-3">
              <span>
                {viewMode === 'resumo'
                  ? `${resumoColaboradores.length} colaborador(es)`
                  : `${totalGrupos} item(ns) (tarefas e atendimentos)`}
              </span>
              <div id="tour-comissao-visao" className="flex items-center gap-2 text-sm font-normal flex-wrap">
                <Label className="whitespace-nowrap">Visão</Label>
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="detalhado">Detalhada</SelectItem>
                    <SelectItem value="resumo">Resumo (total)</SelectItem>
                  </SelectContent>
                </Select>
                {/* Com Tipo = Teste o total já sai por testador; o seletor seria outra forma de
                    dizer o mesmo, e permitiria a combinação sem sentido "Teste / por Elaboração". */}
                {viewMode === 'resumo' && !creditoPorTeste && (
                  <>
                    <Label className="whitespace-nowrap">Totalizar por</Label>
                    <Select value={totalizarPor} onValueChange={setTotalizarPor}>
                      <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elaboracao">Elaboração</SelectItem>
                        <SelectItem value="teste">Teste</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
                {viewMode === 'detalhado' && (
                  <>
                    <Label className="whitespace-nowrap">Ordenar por</Label>
                    <Select
                      value={sortConfig.ordem}
                      onValueChange={(ordem) => setSortConfig((prev) => ({ ...prev, ordem }))}
                    >
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ordensSecundarias.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSortConfig((prev) => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                      title={sortConfig.direction === 'asc' ? 'Crescente' : 'Decrescente'}
                    >
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div id="tour-comissao-tabela" className="overflow-x-auto">
              {viewMode === 'resumo' ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead className="font-semibold text-brand-blue">Colaborador</TableHead>
                      <TableHead className="font-semibold text-brand-blue text-right">
                        {rotuloTotalResumo}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">Carregando...</TableCell>
                      </TableRow>
                    )}
                    {!isLoading && resumoColaboradores.map((r) => (
                      <TableRow key={r.colaboradorId} className="hover:bg-muted/40">
                        <TableCell>{r.nome}</TableCell>
                        <TableCell className="text-right font-semibold">{r.total}</TableCell>
                      </TableRow>
                    ))}
                    {!isLoading && resumoColaboradores.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          Nenhum registro encontrado com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      {colunasLinhaAtivas.map((col) => (
                        <TableHead key={col.id} className="font-semibold text-brand-blue">{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={numColunasLinha} className="text-center text-muted-foreground">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && secoes.map((secao) => (
                      <Fragment key={secao.chave}>
                        <TableRow className="bg-brand-blue/20 hover:bg-brand-blue/20">
                          <TableCell colSpan={numColunasLinha} className="font-bold text-brand-blue">
                            {secao.nome} — {secao.grupos.length} item(ns)
                          </TableCell>
                        </TableRow>
                        {secao.grupos.map((grupo) => (
                          <Fragment key={grupo.tarefaId}>
                            <TableRow className="bg-brand-blue/10 hover:bg-brand-blue/10">
                              <TableCell colSpan={numColunasLinha} className="font-semibold text-brand-blue">
                                {buildGroupHeader(grupo)}
                              </TableCell>
                            </TableRow>
                            {buildTemposGrupo(grupo) && (
                              <TableRow className="bg-brand-blue/5 hover:bg-brand-blue/5">
                                <TableCell colSpan={numColunasLinha} className="text-xs text-muted-foreground">
                                  {buildTemposGrupo(grupo)}
                                </TableCell>
                              </TableRow>
                            )}
                            {grupo.itens.map((item) => (
                              <TableRow key={item.id} className="hover:bg-muted/40">
                                {colunasLinhaAtivas.map((col) => (
                                  <TableCell key={col.id}>{item[col.id]}</TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </Fragment>
                        ))}
                      </Fragment>
                    ))}
                    {!isLoading && secoes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={numColunasLinha} className="text-center text-muted-foreground">
                          Nenhum registro encontrado com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
