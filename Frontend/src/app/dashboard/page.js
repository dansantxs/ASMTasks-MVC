'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  FolderCheck,
  ClipboardList,
  ClipboardCheck,
  UserMinus,
  TrendingUp,
  Filter,
  X,
  Users,
  Clock,
  PackageX,
  UserX,
  TimerOff,
  Inbox,
  ChevronDown,
  CalendarRange,
} from 'lucide-react';
import { getDashboard } from './api/dashboard';
import { useUsuarioAtual } from '../../hooks/useUsuarioAtual';
import TourGuia from '../../components/TourGuia';
import { Combobox } from '../../components/ui/form/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/form/select';

const PERIODOS = [
  { value: 'mesAtual', label: 'Mês atual' },
  { value: 'mesAnterior', label: 'Mês anterior' },
  { value: 'ultimos30', label: 'Últimos 30 dias' },
];

const INDICADOR_VAZIO = { total: 0, itens: [] };

const formatarDataHora = (valor) =>
  valor
    ? new Date(valor).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
      })
    : null;

const juntar = (...partes) => partes.filter((p) => p != null && p !== '').join(' · ');

/** Uma linha da lista de um indicador: o que é, de quem é, e quem mexeu por último. */
function LinhaIndicador({ item }) {
  const contexto = juntar(item.projetoTitulo, item.clienteNome);
  const situacao = juntar(item.colaboradorNome ?? 'Sem responsável', item.etapaNome, item.statusAtual);
  const ultimaAcao = item.ultimaAcaoEm
    ? `Última ação: ${juntar(item.ultimaAcaoPor, formatarDataHora(item.ultimaAcaoEm))}`
    : null;

  return (
    <div className="py-2 border-b last:border-0">
      <p className="text-xs font-semibold text-gray-800 break-words" title={item.titulo}>{item.titulo}</p>
      {contexto && <p className="text-xs text-gray-500 mt-0.5 truncate" title={contexto}>{contexto}</p>}
      {situacao && <p className="text-xs text-gray-500 mt-0.5 truncate" title={situacao}>{situacao}</p>}
      {ultimaAcao && <p className="text-xs text-gray-400 mt-0.5 truncate">{ultimaAcao}</p>}
    </div>
  );
}

function ListaIndicador({ indicador }) {
  const { total = 0, itens = [] } = indicador ?? INDICADOR_VAZIO;
  return (
    <>
      {itens.map((item) => <LinhaIndicador key={item.id} item={item} />)}
      {total > itens.length && (
        <p className="pt-2 text-xs text-gray-400 italic">
          Mostrando {itens.length} de {total} — refine o filtro para ver o restante.
        </p>
      )}
    </>
  );
}

/**
 * Card de indicador. O número e a lista vêm do mesmo indicador do backend, então batem sempre.
 * A lista abre no hover e o clique fixa, para dar tempo de rolar listas longas.
 */
function CardKPI({ icone: Icone, titulo, indicador, corIcone, corFundo, destaque }) {
  const [aberto, setAberto] = useState(false);
  const [fixado, setFixado] = useState(false);
  const timerRef = useRef(null);
  const { total = 0, itens = [] } = indicador ?? INDICADOR_VAZIO;

  const aoEntrar = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (total > 0) setAberto(true);
  };
  const aoSair = () => {
    if (fixado) return;
    timerRef.current = setTimeout(() => setAberto(false), 150);
  };

  return (
    <div
      className={`relative rounded-xl border bg-white p-5 flex items-center gap-4 shadow-sm ${destaque ? 'ring-2 ring-red-400' : ''} ${total > 0 ? 'cursor-pointer' : ''}`}
      onMouseEnter={aoEntrar}
      onMouseLeave={aoSair}
      onClick={() => {
        if (total === 0) return;
        setFixado((v) => !v);
        setAberto(true);
      }}
    >
      <div className={`p-3 rounded-lg ${corFundo} shrink-0`}>
        <Icone className={`h-6 w-6 ${corIcone}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 leading-tight">{titulo}</p>
        <p className="text-2xl font-bold text-gray-800">{total}</p>
      </div>
      {aberto && itens.length > 0 && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-96 max-w-[90vw] bg-white border rounded-xl shadow-xl p-3 max-h-80 overflow-y-auto"
          onMouseEnter={aoEntrar}
          onMouseLeave={aoSair}
          onClick={(e) => e.stopPropagation()}
        >
          <ListaIndicador indicador={indicador} />
        </div>
      )}
    </div>
  );
}

/** Barra da distribuição por etapa/prioridade. Quando tem lista, o clique abre as tarefas. */
function BarraHorizontal({ label, valor, total, cor, itens, totalItens }) {
  const [aberto, setAberto] = useState(false);
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  const clicavel = Array.isArray(itens) && itens.length > 0;

  return (
    <div className="mb-3">
      <button
        type="button"
        disabled={!clicavel}
        onClick={() => setAberto((v) => !v)}
        className="w-full text-left disabled:cursor-default"
      >
        <div className="flex justify-between text-sm mb-1 items-center gap-2">
          <span className="text-gray-700 font-medium truncate flex items-center gap-1">
            {clicavel && <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${aberto ? '' : '-rotate-90'}`} />}
            {label}
          </span>
          <span className="text-gray-500 shrink-0">{valor}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: cor || '#3b82f6' }}
          />
        </div>
      </button>
      {aberto && clicavel && (
        <div className="mt-2 ml-4 pl-3 border-l max-h-64 overflow-y-auto">
          <ListaIndicador indicador={{ total: totalItens ?? valor, itens }} />
        </div>
      )}
    </div>
  );
}

function GraficoTendencia({ tendencia }) {
  const maximo = Math.max(...tendencia.map((t) => t.total), 1);
  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  return (
    <div className="flex items-end gap-2 h-28 mt-2">
      {tendencia.map((item) => {
        const altura = Math.max(Math.round((item.total / maximo) * 100), item.total > 0 ? 8 : 2);
        const ehAtual = item.mes === mesAtual && item.ano === anoAtual;
        return (
          <div key={`${item.ano}-${item.mes}`} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-500 font-medium">{item.total > 0 ? item.total : ''}</span>
            <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
              <div
                className={`w-full rounded-t transition-all duration-500 ${ehAtual ? 'bg-blue-600' : 'bg-blue-300'}`}
                style={{ height: `${altura}%` }}
                title={`${item.label}: ${item.total}`}
              />
            </div>
            <span className="text-xs text-gray-400 leading-tight text-center">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProximosAtendimentos({ itens }) {
  if (!itens || itens.length === 0) {
    return <p className="text-sm text-gray-400">Nenhum atendimento agendado nos próximos dias.</p>;
  }

  return (
    <ul className="space-y-2">
      {itens.map((item) => {
        const data = new Date(item.dataHoraInicio);
        const hoje = new Date();
        const diffMs = data - hoje;
        const diffH = Math.round(diffMs / 3600000);
        const diffD = Math.floor(diffMs / 86400000);
        const proximidade =
          diffH < 1 ? 'Em breve' :
          diffH < 24 ? `Em ${diffH}h` :
          diffD === 1 ? 'Amanhã' :
          `Em ${diffD} dias`;
        const urgente = diffH < 2;

        return (
          <li key={item.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${urgente ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50'}`}>
            <Clock className={`h-4 w-4 mt-0.5 shrink-0 ${urgente ? 'text-amber-500' : 'text-gray-400'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{item.titulo}</p>
              <p className="text-xs text-gray-500 truncate">{item.clienteNome}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-xs font-semibold ${urgente ? 'text-amber-600' : 'text-gray-500'}`}>{proximidade}</p>
              <p className="text-xs text-gray-400">
                {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ProjetosSemMovimentacao({ itens }) {
  if (!itens || itens.length === 0) {
    return <p className="text-sm text-gray-400">Nenhum projeto parado há mais de 15 dias.</p>;
  }

  return (
    <ul className="space-y-2">
      {itens.map((item) => {
        const critico = item.diasParado > 30;
        const label = item.ultimaMovimentacao
          ? `Parado há ${item.diasParado} dias`
          : 'Sem movimentação registrada';

        return (
          <li key={item.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${critico ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <PackageX className={`h-4 w-4 mt-0.5 shrink-0 ${critico ? 'text-red-500' : 'text-amber-500'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">{item.titulo}</p>
              <p className="text-xs text-gray-500 truncate">{item.clienteNome}</p>
            </div>
            <span className={`text-xs font-semibold shrink-0 ${critico ? 'text-red-600' : 'text-amber-600'}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ColaboradoresOciosos({ itens }) {
  if (!itens || itens.length === 0) {
    return <p className="text-sm text-gray-400">Todos os colaboradores têm tarefas atribuídas.</p>;
  }

  return (
    <ul className="space-y-2">
      {itens.map((item) => (
        <li key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
          <UserX className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="flex-1 text-sm text-gray-700 truncate">{item.nome}</span>
          {item.setorNome && (
            <span className="text-xs text-gray-400 shrink-0 bg-gray-200 px-2 py-0.5 rounded-full">
              {item.setorNome}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Ranking completo: mostra os primeiros e expande no "Ver todos". */
function RankingColaboradores({ titulo, itens, corBadge, visiveisPadrao = 5 }) {
  const [verTodos, setVerTodos] = useState(false);

  if (!itens || itens.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">{titulo}</p>
        <p className="text-sm text-gray-400">Nenhum dado neste período.</p>
      </div>
    );
  }

  const exibidos = verTodos ? itens : itens.slice(0, visiveisPadrao);

  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-3">{titulo}</p>
      <ol className={`space-y-2 ${verTodos ? 'max-h-72 overflow-y-auto pr-1' : ''}`}>
        {exibidos.map((item, idx) => (
          <li key={item.nome} className="flex items-center gap-3">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${corBadge}`}
            >
              {idx + 1}
            </span>
            <span className="flex-1 text-sm text-gray-700 truncate">{item.nome}</span>
            <span className="text-sm font-semibold text-gray-800 shrink-0">{item.total}</span>
          </li>
        ))}
      </ol>
      {itens.length > visiveisPadrao && (
        <button
          type="button"
          onClick={() => setVerTodos((v) => !v)}
          className="mt-3 text-xs font-medium text-brand-blue hover:underline"
        >
          {verTodos ? 'Ver menos' : `Ver todos (${itens.length})`}
        </button>
      )}
    </div>
  );
}

function TituloSecao({ icone: Icone, cor, children, sufixo }) {
  return (
    <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
      <Icone className={`h-4 w-4 ${cor}`} />
      {children}
      {sufixo && (
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{sufixo}</span>
      )}
    </h2>
  );
}

export default function DashboardPage() {
  const { usuario } = useUsuarioAtual();
  const ehAdministrador = usuario?.ehAdministrador ?? false;
  const nomeUsuario = usuario?.colaboradorNome ?? '';

  const [filtroColaboradorId, setFiltroColaboradorId] = useState('');
  const [periodoId, setPeriodoId] = useState('mesAtual');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', filtroColaboradorId, periodoId],
    queryFn: () => getDashboard(filtroColaboradorId ? Number(filtroColaboradorId) : null, periodoId),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });

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
            element: '#tour-dashboard-cabecalho',
            popover: {
              title: 'Dashboard',
              description: 'Visão consolidada de atendimentos, tarefas e projetos. Administradores visualizam dados de toda a equipe; colaboradores veem somente seus próprios dados.',
              side: 'bottom',
              align: 'start',
            },
          },
          {
            element: '#tour-dashboard-periodo',
            popover: {
              title: 'Período',
              description: 'Define a janela dos indicadores marcados como <strong>do período</strong> (realizados, concluídos, cadastrados e os rankings). Logo depois da virada do mês, use <strong>Mês anterior</strong> para ver o mês que fechou.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-dashboard-filtro',
            popover: {
              title: 'Filtro por Colaborador',
              description: 'Selecione um colaborador específico para visualizar somente os dados dele. Deixe em branco para ver todos.',
              side: 'bottom',
              align: 'end',
            },
          },
          {
            element: '#tour-dashboard-atendimentos',
            popover: {
              title: 'Atendimentos',
              description: 'Agendados hoje, pendentes e realizados no período, e os que passaram do prazo. <strong>Passe o mouse</strong> em qualquer card para ver a lista — e <strong>clique</strong> para fixá-la e poder rolar.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-tarefas-situacao',
            popover: {
              title: 'Tarefas — Situação Atual',
              description: 'Foto de agora: o que está em andamento, o que está no backlog, o que está sem responsável e o que ainda não foi iniciado. Cada lista mostra <strong>responsável</strong>, <strong>etapa</strong>, <strong>status</strong> e <strong>quem mexeu por último, quando</strong>.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-tarefas-etapas',
            popover: {
              title: 'Tarefas por Etapa',
              description: 'Distribuição das tarefas pelas etapas do fluxo. <strong>Clique numa barra</strong> para ver quais tarefas estão naquela etapa.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-producao',
            popover: {
              title: 'Produção do Período',
              description: 'O que foi entregue na janela escolhida, e o ranking de quem entregou. Use <strong>Ver todos</strong> para sair do top 5 e ver a equipe inteira.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-cabecalho',
            popover: {
              title: 'Informações Importantes',
              description: 'ℹ️ O dashboard exibe dados <strong>somente leitura</strong> — não é possível alterar ou excluir registros diretamente aqui. Acesse as telas específicas (Atendimentos, Projetos, Kanban) para fazer alterações.<br><br>⚠️ Se um card mostrar "Mostrando X de Y", a lista foi cortada — filtre por colaborador para ver o restante.<br>⛔ <strong>Erro ao carregar:</strong> se o dashboard não carregar, verifique sua conexão e tente novamente.',
              side: 'bottom',
              align: 'start',
            },
          },
        ].filter((p) => !p.element || document.querySelector(p.element)),
      });
      tour.drive();
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Carregando dashboard...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-sm">Erro ao carregar o dashboard. Tente novamente.</div>
      </div>
    );
  }

  const { atendimentos, tarefas, projetos, colaboradores, colaboradoresDisponiveis, filtro, periodo } = data;
  const rotuloPeriodo = periodo?.label ?? 'Mês atual';
  const tituloSecao = filtro ? `Visualizando: ${filtro.colaboradorNome}` : ehAdministrador ? 'Visão Geral' : 'Meu Painel';

  // Denominador das barras: a soma das próprias faixas. Usar um "total de tarefas" separado fazia
  // os percentuais não fecharem em 100%.
  const totalPorEtapa = tarefas.porEtapa.reduce((acc, item) => acc + item.total, 0);
  const totalPorPrioridade = tarefas.porPrioridade.reduce((acc, item) => acc + item.total, 0);
  const cargaMaxima = Math.max(...(tarefas.cargaPorColaborador ?? []).map((c) => c.total), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Cabeçalho */}
      <div id="tour-dashboard-cabecalho" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {ehAdministrador ? 'Dashboard Geral' : 'Meu Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">{dataFormatada}</p>
          {!ehAdministrador && nomeUsuario && (
            <p className="text-sm text-gray-400 mt-0.5">
              Bem-vindo, <span className="font-medium text-gray-600">{nomeUsuario}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <TourGuia aoIniciar={iniciarTour} />
          <div id="tour-dashboard-periodo" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-gray-400 shrink-0" />
            <Select value={periodoId} onValueChange={setPeriodoId}>
              <SelectTrigger className="min-w-[170px] bg-white">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {ehAdministrador && colaboradoresDisponiveis?.length > 0 && (
          <div id="tour-dashboard-filtro" className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <Combobox
              className="min-w-[200px] bg-white"
              value={filtroColaboradorId}
              onValueChange={setFiltroColaboradorId}
              placeholder="Todos os colaboradores"
              searchPlaceholder="Buscar colaborador..."
              options={[
                { value: '', label: 'Todos os colaboradores' },
                ...colaboradoresDisponiveis.map((c) => ({ value: String(c.id), label: c.nome })),
              ]}
            />
            {filtroColaboradorId && (
              <button
                onClick={() => setFiltroColaboradorId('')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                title="Limpar filtro"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          )}
        </div>
      </div>

      {filtro && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          Exibindo dados de <strong>{filtro.colaboradorNome}</strong>
        </div>
      )}

      {/* ───── ATENDIMENTOS ───── */}
      <section id="tour-dashboard-atendimentos">
        <TituloSecao icone={CalendarClock} cor="text-blue-500">
          Atendimentos · {tituloSecao}
        </TituloSecao>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardKPI
            icone={CalendarCheck}
            titulo="Agendados Hoje"
            indicador={atendimentos.hoje}
            corIcone="text-blue-600"
            corFundo="bg-blue-50"
          />
          <CardKPI
            icone={CalendarClock}
            titulo={`Pendentes (${rotuloPeriodo})`}
            indicador={atendimentos.pendentesPeriodo}
            corIcone="text-amber-600"
            corFundo="bg-amber-50"
          />
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso"
            indicador={atendimentos.emAtraso}
            corIcone="text-red-600"
            corFundo="bg-red-50"
            destaque={atendimentos.emAtraso.total > 0}
          />
          <CardKPI
            icone={CheckCircle2}
            titulo={`Realizados (${rotuloPeriodo})`}
            indicador={atendimentos.realizadosPeriodo}
            corIcone="text-emerald-600"
            corFundo="bg-emerald-50"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Realizados — Últimos 6 Meses
            </p>
            <p className="text-xs text-gray-400 mt-0.5 mb-2">Mês atual em azul escuro</p>
            <GraficoTendencia tendencia={atendimentos.tendencia} />
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos Atendimentos
            </p>
            <ProximosAtendimentos itens={atendimentos.proximos} />
          </div>
        </div>
      </section>

      {/* ───── TAREFAS: SITUAÇÃO ATUAL ───── */}
      <section id="tour-dashboard-tarefas-situacao">
        <TituloSecao icone={ClipboardList} cor="text-violet-500" sufixo="Foto de agora">
          Tarefas — Situação Atual · {tituloSecao}
        </TituloSecao>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardKPI
            icone={ClipboardList}
            titulo="Em Andamento"
            indicador={tarefas.emAndamento}
            corIcone="text-violet-600"
            corFundo="bg-violet-50"
          />
          <CardKPI
            icone={Inbox}
            titulo="No Backlog"
            indicador={tarefas.backlog}
            corIcone="text-slate-600"
            corFundo="bg-slate-100"
          />
          <CardKPI
            icone={TimerOff}
            titulo="Não Iniciadas"
            indicador={tarefas.ociosas}
            corIcone={tarefas.ociosas.total > 0 ? 'text-amber-600' : 'text-gray-400'}
            corFundo={tarefas.ociosas.total > 0 ? 'bg-amber-50' : 'bg-gray-100'}
          />
          {ehAdministrador && !filtro && (
            <CardKPI
              icone={UserMinus}
              titulo="Sem Responsável"
              indicador={tarefas.semResponsavel}
              corIcone={tarefas.semResponsavel.total > 0 ? 'text-orange-500' : 'text-gray-400'}
              corFundo={tarefas.semResponsavel.total > 0 ? 'bg-orange-50' : 'bg-gray-100'}
              destaque={tarefas.semResponsavel.total > 0}
            />
          )}
        </div>
      </section>

      {/* ───── TAREFAS: ALERTAS ───── */}
      <section>
        <TituloSecao icone={AlertTriangle} cor="text-red-500" sufixo="Passaram do tempo previsto">
          Tarefas — Alertas
        </TituloSecao>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso — Execução"
            indicador={tarefas.execucaoEmAtraso}
            corIcone={tarefas.execucaoEmAtraso.total > 0 ? 'text-red-600' : 'text-gray-400'}
            corFundo={tarefas.execucaoEmAtraso.total > 0 ? 'bg-red-50' : 'bg-gray-100'}
            destaque={tarefas.execucaoEmAtraso.total > 0}
          />
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso — Teste"
            indicador={tarefas.testeEmAtraso}
            corIcone={tarefas.testeEmAtraso.total > 0 ? 'text-blue-600' : 'text-gray-400'}
            corFundo={tarefas.testeEmAtraso.total > 0 ? 'bg-blue-50' : 'bg-gray-100'}
            destaque={tarefas.testeEmAtraso.total > 0}
          />
        </div>
      </section>

      {/* ───── TAREFAS: DISTRIBUIÇÃO ───── */}
      <section id="tour-dashboard-tarefas-etapas">
        <TituloSecao icone={ClipboardList} cor="text-violet-500">
          Tarefas — Distribuição
        </TituloSecao>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-1">Por Etapa</p>
            <p className="text-xs text-gray-400 mb-4">Clique numa etapa para ver as tarefas.</p>
            {tarefas.porEtapa.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa em andamento.</p>
              : tarefas.porEtapa.map((item) => (
                <BarraHorizontal
                  key={item.etapaId ?? 'backlog'}
                  label={item.etapa}
                  valor={item.total}
                  total={totalPorEtapa}
                  cor={item.etapaId == null ? '#94a3b8' : item.ehEtapaFinal ? '#10b981' : '#8b5cf6'}
                  itens={item.itens}
                  totalItens={item.total}
                />
              ))
            }
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-4">Por Prioridade</p>
            {tarefas.porPrioridade.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa em andamento.</p>
              : tarefas.porPrioridade.map((item) => (
                <BarraHorizontal
                  key={item.prioridade}
                  label={item.prioridade}
                  valor={item.total}
                  total={totalPorPrioridade}
                  cor={item.cor}
                />
              ))
            }
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-1">Carga por Colaborador</p>
            <p className="text-xs text-gray-400 mb-4">Tarefas abertas atribuídas hoje.</p>
            {(tarefas.cargaPorColaborador ?? []).length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa atribuída.</p>
              : tarefas.cargaPorColaborador.map((item) => (
                <BarraHorizontal
                  key={item.id}
                  label={item.nome}
                  valor={item.total}
                  total={cargaMaxima}
                  cor="#6366f1"
                />
              ))
            }
          </div>
        </div>
      </section>

      {/* ───── PRODUÇÃO DO PERÍODO ───── */}
      <section id="tour-dashboard-producao">
        <TituloSecao icone={CheckCircle2} cor="text-emerald-500" sufixo={rotuloPeriodo}>
          Produção do Período
        </TituloSecao>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardKPI
            icone={ClipboardCheck}
            titulo="Tarefas Concluídas"
            indicador={tarefas.concluidasPeriodo}
            corIcone="text-emerald-600"
            corFundo="bg-emerald-50"
          />
          <CardKPI
            icone={CheckCircle2}
            titulo="Atendimentos Realizados"
            indicador={atendimentos.realizadosPeriodo}
            corIcone="text-blue-600"
            corFundo="bg-blue-50"
          />
          {ehAdministrador && projetos && (
            <CardKPI
              icone={FolderCheck}
              titulo="Projetos Concluídos"
              indicador={projetos.concluidosPeriodo}
              corIcone="text-teal-600"
              corFundo="bg-teal-50"
            />
          )}
        </div>

        {ehAdministrador && colaboradores && !filtro && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <RankingColaboradores
                titulo="Tarefas Concluídas por Colaborador"
                itens={colaboradores.tarefasConcluidasPeriodo}
                corBadge="bg-emerald-500"
              />
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <RankingColaboradores
                titulo="Atendimentos Realizados por Colaborador"
                itens={colaboradores.atendimentosPeriodo}
                corBadge="bg-blue-500"
              />
            </div>
          </div>
        )}
      </section>

      {/* ───── ADMIN: PROJETOS + RISCOS ───── */}
      {ehAdministrador && projetos && colaboradores && !filtro && (
        <>
          <section>
            <TituloSecao icone={FolderOpen} cor="text-teal-500">
              Projetos
            </TituloSecao>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardKPI
                icone={FolderOpen}
                titulo="Projetos Ativos"
                indicador={projetos.ativos}
                corIcone="text-teal-600"
                corFundo="bg-teal-50"
              />
              <CardKPI
                icone={CalendarCheck}
                titulo={`Cadastrados (${rotuloPeriodo})`}
                indicador={projetos.cadastradosPeriodo}
                corIcone="text-blue-600"
                corFundo="bg-blue-50"
              />
            </div>
          </section>

          <section>
            <TituloSecao icone={PackageX} cor="text-amber-500">
              Riscos
            </TituloSecao>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-amber-500" />
                  Projetos Parados há +15 dias
                </p>
                <ProjetosSemMovimentacao itens={data.projetosSemMovimentacao} />
              </div>

              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserX className="h-4 w-4 text-gray-500" />
                  Colaboradores sem Tarefas Atribuídas
                </p>
                <ColaboradoresOciosos itens={colaboradores.semTarefasAtribuidas} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
