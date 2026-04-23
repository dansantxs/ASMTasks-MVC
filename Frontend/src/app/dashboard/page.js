'use client';

import { useState, useCallback } from 'react';
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
} from 'lucide-react';
import { getDashboard } from './api/dashboard';
import { obterSessaoArmazenada } from '../../shared/auth/session';
import TourGuia from '../../shared/components/TourGuia';

function CardKPI({ icone: Icone, titulo, valor, corIcone, corFundo, destaque, sufixo }) {
  return (
    <div className={`rounded-xl border bg-white p-5 flex items-center gap-4 shadow-sm ${destaque ? 'ring-2 ring-red-400' : ''}`}>
      <div className={`p-3 rounded-lg ${corFundo} shrink-0`}>
        <Icone className={`h-6 w-6 ${corIcone}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 leading-tight">{titulo}</p>
        <p className="text-2xl font-bold text-gray-800">
          {valor}{sufixo && <span className="text-base font-medium text-gray-500 ml-1">{sufixo}</span>}
        </p>
      </div>
    </div>
  );
}

function BarraHorizontal({ label, valor, total, cor }) {
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium truncate pr-2">{label}</span>
        <span className="text-gray-500 shrink-0">{valor}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: cor || '#3b82f6' }}
        />
      </div>
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

function RankingColaboradores({ titulo, itens, corBadge }) {
  if (!itens || itens.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-2">{titulo}</p>
        <p className="text-sm text-gray-400">Nenhum dado neste período.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-3">{titulo}</p>
      <ol className="space-y-2">
        {itens.map((item, idx) => (
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
    </div>
  );
}

export default function DashboardPage() {
  const sessao = obterSessaoArmazenada();
  const ehAdministrador = sessao?.ehAdministrador ?? false;
  const nomeUsuario = sessao?.colaboradorNome ?? '';

  const [filtroColaboradorId, setFiltroColaboradorId] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', filtroColaboradorId],
    queryFn: () => getDashboard(filtroColaboradorId ? Number(filtroColaboradorId) : null),
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
              description: 'KPIs de atendimentos: agendados hoje, pendentes, em atraso e realizados no mês. O gráfico mostra a tendência dos últimos 6 meses e a lista exibe os próximos agendamentos.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-tarefas',
            popover: {
              title: 'Tarefas de Projetos Ativos',
              description: 'KPIs das tarefas em andamento: em elaboração, concluídas este mês e sem responsável. Os gráficos mostram a distribuição por etapa e por prioridade.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-projetos',
            popover: {
              title: 'Projetos',
              description: 'Visão geral dos projetos: cadastrados hoje, ativos e concluídos no mês. Disponível apenas para administradores.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-rankings',
            popover: {
              title: 'Ranking de Colaboradores',
              description: 'Top colaboradores do mês em atendimentos realizados, tarefas concluídas e tarefas atribuídas. Útil para reconhecer o desempenho da equipe.',
              side: 'top',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-cabecalho',
            popover: {
              title: 'Informações Importantes',
              description: 'ℹ️ O dashboard exibe dados <strong>somente leitura</strong> — não é possível alterar ou excluir registros diretamente aqui. Acesse as telas específicas (Atendimentos, Projetos, Kanban) para fazer alterações.<br><br>⚠️ <strong>Dados desatualizados:</strong> os dados são atualizados automaticamente ao acessar a tela. Se os números parecerem incorretos, recarregue a página.<br>⛔ <strong>Erro ao carregar:</strong> se o dashboard não carregar, verifique sua conexão e tente novamente.',
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

  const { atendimentos, tarefas, projetos, colaboradores, colaboradoresDisponiveis, filtro } = data;
  const totalTarefasParaBarra = tarefas.total || 1;
  const tituloSecao = filtro ? `Visualizando: ${filtro.colaboradorNome}` : ehAdministrador ? 'Visão Geral' : 'Meu Painel';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

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

        <div className="flex items-center gap-3">
          <TourGuia aoIniciar={iniciarTour} />
          {ehAdministrador && colaboradoresDisponiveis?.length > 0 && (
          <div id="tour-dashboard-filtro" className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
            <select
              value={filtroColaboradorId}
              onChange={(e) => setFiltroColaboradorId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">Todos os colaboradores</option>
              {colaboradoresDisponiveis.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
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
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-blue-500" />
          Atendimentos · {tituloSecao}
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CardKPI
            icone={CalendarCheck}
            titulo="Agendados Hoje"
            valor={atendimentos.hoje}
            corIcone="text-blue-600"
            corFundo="bg-blue-50"
          />
          <CardKPI
            icone={CalendarClock}
            titulo="Pendentes (total)"
            valor={atendimentos.agendados}
            corIcone="text-amber-600"
            corFundo="bg-amber-50"
          />
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso"
            valor={atendimentos.emAtraso}
            corIcone="text-red-600"
            corFundo="bg-red-50"
            destaque={atendimentos.emAtraso > 0}
          />
          <CardKPI
            icone={CheckCircle2}
            titulo="Realizados Este Mês"
            valor={atendimentos.realizadosMes}
            corIcone="text-emerald-600"
            corFundo="bg-emerald-50"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Gráfico tendência */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Realizados — Últimos 6 Meses
            </p>
            <p className="text-xs text-gray-400 mt-0.5 mb-2">Mês atual em azul escuro</p>
            <GraficoTendencia tendencia={atendimentos.tendencia} />
          </div>

          {/* Próximos atendimentos */}
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos Atendimentos
            </p>
            <ProximosAtendimentos itens={atendimentos.proximos} />
          </div>
        </div>
      </section>

      {/* ───── TAREFAS ───── */}
      <section id="tour-dashboard-tarefas">
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-violet-500" />
          Tarefas (projetos ativos) · {tituloSecao}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <CardKPI
            icone={ClipboardList}
            titulo="Em Andamento"
            valor={tarefas.total}
            corIcone="text-violet-600"
            corFundo="bg-violet-50"
          />
          <CardKPI
            icone={ClipboardCheck}
            titulo="Concluídas Este Mês"
            valor={tarefas.concluidasMes}
            corIcone="text-emerald-600"
            corFundo="bg-emerald-50"
          />
          {ehAdministrador && !filtro && (
            <CardKPI
              icone={UserMinus}
              titulo="Sem Responsável"
              valor={tarefas.semResponsavel}
              corIcone={tarefas.semResponsavel > 0 ? 'text-orange-500' : 'text-gray-400'}
              corFundo={tarefas.semResponsavel > 0 ? 'bg-orange-50' : 'bg-gray-100'}
              destaque={tarefas.semResponsavel > 0}
            />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-4">Por Etapa</p>
            {tarefas.tarefasBacklog > 0 && (
              <BarraHorizontal
                label="Backlog"
                valor={tarefas.tarefasBacklog}
                total={totalTarefasParaBarra}
                cor="#94a3b8"
              />
            )}
            {tarefas.porEtapa.length === 0 && tarefas.tarefasBacklog === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa cadastrada.</p>
              : tarefas.porEtapa.map((item) => (
                <BarraHorizontal
                  key={item.etapa}
                  label={item.etapa}
                  valor={item.total}
                  total={totalTarefasParaBarra}
                  cor={item.ehEtapaFinal ? '#10b981' : '#8b5cf6'}
                />
              ))
            }
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-4">Por Prioridade</p>
            {tarefas.porPrioridade.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa cadastrada.</p>
              : tarefas.porPrioridade.map((item) => (
                <BarraHorizontal
                  key={item.prioridade}
                  label={item.prioridade}
                  valor={item.total}
                  total={totalTarefasParaBarra}
                  cor={item.cor}
                />
              ))
            }
          </div>
        </div>
      </section>

      {/* ───── ADMIN: PROJETOS + RANKINGS ───── */}
      {ehAdministrador && projetos && colaboradores && !filtro && (
        <>
          <section id="tour-dashboard-projetos">
            <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-teal-500" />
              Projetos
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CardKPI
                icone={CalendarCheck}
                titulo="Cadastrados Hoje"
                valor={projetos.cadastradosHoje}
                corIcone="text-blue-600"
                corFundo="bg-blue-50"
              />
              <CardKPI
                icone={FolderOpen}
                titulo="Projetos Ativos"
                valor={projetos.ativos}
                corIcone="text-teal-600"
                corFundo="bg-teal-50"
              />
              <CardKPI
                icone={FolderCheck}
                titulo="Concluídos Este Mês"
                valor={projetos.concluidosMes}
                corIcone="text-emerald-600"
                corFundo="bg-emerald-50"
              />
            </div>
          </section>

          <section id="tour-dashboard-rankings">
            <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Ranking de Colaboradores — Este Mês
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <RankingColaboradores
                  titulo="Atendimentos Realizados"
                  itens={colaboradores.topAtendimentosMes}
                  corBadge="bg-blue-500"
                />
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <RankingColaboradores
                  titulo="Tarefas Concluídas"
                  itens={colaboradores.topTarefasConcluidas}
                  corBadge="bg-emerald-500"
                />
              </div>
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <RankingColaboradores
                  titulo="Tarefas Atribuídas (total)"
                  itens={colaboradores.topTarefasAtribuidas}
                  corBadge="bg-violet-500"
                />
              </div>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Projetos sem movimentação */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <PackageX className="h-4 w-4 text-amber-500" />
                  Projetos Parados há +15 dias
                </h2>
                <ProjetosSemMovimentacao itens={data.projetosSemMovimentacao} />
              </div>

              {/* Colaboradores sem tarefas */}
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserX className="h-4 w-4 text-gray-500" />
                  Colaboradores sem Tarefas Atribuídas
                </h2>
                <ColaboradoresOciosos itens={colaboradores.semTarefasAtribuidas} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
