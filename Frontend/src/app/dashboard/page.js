'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Inbox,
  Bookmark,
  CalendarRange,
} from 'lucide-react';
import { getDashboard } from './api/dashboard';
import { useUsuarioAtual } from '../../hooks/useUsuarioAtual';
import TourGuia from '../../components/TourGuia';
import { Combobox } from '../../components/ui/form/combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/form/select';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ehEtapaElaboracao, ehReservado, rotuloEtapa } from '../../utils/situacaoTarefa';

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

/**
 * Uma linha da lista de um indicador: o que é, de quem é, e quem mexeu por último.
 * Nada é truncado — o painel é largo e o texto quebra em mais linhas, porque o nome da etapa
 * e o do responsável são justamente o que se quer ler aqui.
 */
function LinhaIndicador({ item }) {
  const contexto = juntar(item.projetoTitulo, item.clienteNome);
  // "Reservado" já diz que a tarefa não foi iniciada: repetir "Ociosa" ao lado só polui.
  const reservado = ehReservado(item.etapaNome, item.statusAtual);
  const situacao = juntar(
    item.colaboradorNome ?? 'Sem responsável',
    rotuloEtapa(item.etapaNome, item.statusAtual),
    reservado ? null : item.statusAtual
  );
  const ultimaAcao = item.ultimaAcaoEm
    ? `Última ação: ${juntar(item.ultimaAcaoPor, formatarDataHora(item.ultimaAcaoEm))}`
    : null;

  return (
    <div className="py-2 border-b last:border-0">
      <p className="text-sm font-semibold text-gray-800 break-words leading-snug">{item.titulo}</p>
      {contexto && <p className="text-xs text-gray-500 mt-1 break-words">{contexto}</p>}
      {situacao && <p className="text-xs text-gray-600 mt-0.5 break-words">{situacao}</p>}
      {ultimaAcao && <p className="text-xs text-gray-400 mt-0.5 break-words">{ultimaAcao}</p>}
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
 * Abre a lista no hover e fixa no clique. Compartilhado pelos cards e pelas barras, para o
 * gesto ser o mesmo na tela inteira.
 *
 * Enquanto é só hover, o painel não captura o mouse (ver ComPainelLista) e fecha assim que o
 * ponteiro sai do indicador — senão ele fica por cima do indicador vizinho e impede que o
 * vizinho seja apontado. Fixado no clique, aí sim vira interativo e dá para rolar a lista.
 */
function useAberturaLista(temItens) {
  const [aberto, setAberto] = useState(false);
  const [fixado, setFixado] = useState(false);

  const abrir = () => {
    if (temItens) setAberto(true);
  };
  const fechar = () => {
    if (!fixado) setAberto(false);
  };
  const alternarFixado = (evento) => {
    if (!temItens) return;
    // Impede que este mesmo clique chegue ao document e feche o painel na sequência.
    evento?.stopPropagation();
    setFixado((v) => !v);
    setAberto(true);
  };

  // Fixado, só um clique fora solta.
  useEffect(() => {
    if (!fixado) return;
    const aoClicarFora = () => {
      setFixado(false);
      setAberto(false);
    };
    document.addEventListener('click', aoClicarFora);
    return () => document.removeEventListener('click', aoClicarFora);
  }, [fixado]);

  return { aberto: aberto && temItens, fixado, abrir, fechar, alternarFixado };
}

/**
 * Painel da lista, sobre o Popover do Radix (mesmo primitivo do Combobox). É ele que resolve o
 * painel sair da tela: vira para cima quando não cabe embaixo, desloca na horizontal quando
 * encosta na lateral, e expõe --radix-popover-content-available-height, que usamos como altura
 * máxima para o painel nunca passar do rodapé.
 *
 * `children` é o gatilho (card, barra, coluna do gráfico), envolvido pelo Anchor para o painel
 * se posicionar em relação a ele.
 */
function ComPainelLista({ indicador, aberto, fixado, abrir, fechar, children, lado = 'bottom', alinhamento = 'start' }) {
  return (
    <PopoverPrimitive.Root open={aberto}>
      <PopoverPrimitive.Anchor asChild>{children}</PopoverPrimitive.Anchor>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side={lado}
          align={alinhamento}
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={abrir}
          onMouseLeave={fechar}
          onClick={(e) => e.stopPropagation()}
          style={{ maxHeight: 'var(--radix-popover-content-available-height)' }}
          className={`w-[30rem] max-w-[85vw] overflow-y-auto rounded-xl border bg-white p-4 shadow-xl ${
            fixado ? 'z-50 pointer-events-auto ring-2 ring-brand-blue' : 'z-40 pointer-events-none'
          }`}
        >
          <ListaIndicador indicador={indicador} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/**
 * Card de indicador. O número e a lista vêm do mesmo indicador do backend, então batem sempre.
 * `descricao` explica em uma linha o que aquele número conta — sem isso cada card vira uma
 * adivinhação ("em andamento" conta o que está em Atendimento? conta concluída?).
 */
function CardKPI({ icone: Icone, titulo, descricao, indicador, corIcone, corFundo, destaque }) {
  const { total = 0 } = indicador ?? INDICADOR_VAZIO;
  const { aberto, fixado, abrir, fechar, alternarFixado } = useAberturaLista(total > 0);

  return (
    <ComPainelLista indicador={indicador} aberto={aberto} fixado={fixado} abrir={abrir} fechar={fechar}>
      <div
        className={`rounded-xl border bg-white p-5 flex items-start gap-4 shadow-sm ${destaque ? 'ring-2 ring-red-400' : ''} ${total > 0 ? 'cursor-pointer' : ''}`}
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onClick={alternarFixado}
      >
        <div className={`p-3 rounded-lg ${corFundo} shrink-0`}>
          <Icone className={`h-6 w-6 ${corIcone}`} />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 leading-tight">{titulo}</p>
          <p className="text-2xl font-bold text-gray-800">{total}</p>
          {descricao && <p className="text-xs text-gray-400 mt-1 leading-snug">{descricao}</p>}
        </div>
      </div>
    </ComPainelLista>
  );
}

/**
 * Barra da distribuição (etapa / prioridade / colaborador). Abre a lista no mesmo gesto dos
 * cards: hover mostra, clique fixa.
 */
function BarraHorizontal({ label, valor, total, cor, itens, totalItens }) {
  const temLista = Array.isArray(itens) && itens.length > 0;
  const { aberto, fixado, abrir, fechar, alternarFixado } = useAberturaLista(temLista);
  const pct = total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <ComPainelLista
      indicador={{ total: totalItens ?? valor, itens }}
      aberto={aberto}
      fixado={fixado}
      abrir={abrir}
      fechar={fechar}
      // Barra é baixa e vem em lista vertical: abrir ao lado evita cobrir as barras vizinhas.
      lado="right"
      alinhamento="center"
    >
      <div
        className={`mb-3 ${temLista ? 'cursor-pointer' : ''}`}
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onClick={alternarFixado}
      >
        <div className="flex justify-between text-sm mb-1 items-center gap-2">
          <span className="text-gray-700 font-medium truncate">{label}</span>
          <span className="text-gray-500 shrink-0">{valor}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: cor || '#3b82f6' }}
          />
        </div>
      </div>
    </ComPainelLista>
  );
}

/** Uma coluna do gráfico de tendência: hover abre os atendimentos daquele mês. */
function ColunaTendencia({ item, altura, ehAtual }) {
  const { aberto, fixado, abrir, fechar, alternarFixado } = useAberturaLista(item.total > 0);

  return (
    <ComPainelLista
      indicador={{ total: item.total, itens: item.itens ?? [] }}
      aberto={aberto}
      fixado={fixado}
      abrir={abrir}
      fechar={fechar}
      alinhamento="center"
    >
      <div
        className={`flex-1 flex flex-col items-center gap-1 ${item.total > 0 ? 'cursor-pointer' : ''}`}
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onClick={alternarFixado}
      >
        <span className="text-xs text-gray-500 font-medium">{item.total > 0 ? item.total : ''}</span>
        <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
          <div
            className={`w-full rounded-t transition-all duration-500 ${ehAtual ? 'bg-blue-600' : 'bg-blue-300'}`}
            style={{ height: `${altura}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 leading-tight text-center">{item.label}</span>
      </div>
    </ComPainelLista>
  );
}

function GraficoTendencia({ tendencia }) {
  const maximo = Math.max(...tendencia.map((t) => t.total), 1);
  const mesAtual = new Date().getMonth() + 1;
  const anoAtual = new Date().getFullYear();

  return (
    <div className="flex items-end gap-2 h-28 mt-2">
      {tendencia.map((item) => (
        <ColunaTendencia
          key={`${item.ano}-${item.mes}`}
          item={item}
          altura={Math.max(Math.round((item.total / maximo) * 100), item.total > 0 ? 8 : 2)}
          ehAtual={item.mes === mesAtual && item.ano === anoAtual}
        />
      ))}
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

/** Uma linha do ranking: hover abre o que aquele colaborador fez no período. */
function LinhaRanking({ item, posicao, corBadge }) {
  const { aberto, fixado, abrir, fechar, alternarFixado } = useAberturaLista((item.itens?.length ?? 0) > 0);

  return (
    <ComPainelLista
      indicador={{ total: item.total, itens: item.itens ?? [] }}
      aberto={aberto}
      fixado={fixado}
      abrir={abrir}
      fechar={fechar}
      lado="right"
      alinhamento="center"
    >
      <li
        className="flex items-center gap-3 cursor-pointer"
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onClick={alternarFixado}
      >
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${corBadge}`}
        >
          {posicao}
        </span>
        <span className="flex-1 text-sm text-gray-700 truncate">{item.nome}</span>
        <span className="text-sm font-semibold text-gray-800 shrink-0">{item.total}</span>
      </li>
    </ComPainelLista>
  );
}

/** Ranking completo: mostra os primeiros e expande no "Ver todos". */
function RankingColaboradores({ titulo, descricao, itens, corBadge, visiveisPadrao = 5 }) {
  const [verTodos, setVerTodos] = useState(false);

  if (!itens || itens.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-gray-600 mb-1">{titulo}</p>
        {descricao && <p className="text-xs text-gray-400 mb-2">{descricao}</p>}
        <p className="text-sm text-gray-400">Nenhum dado neste período.</p>
      </div>
    );
  }

  const exibidos = verTodos ? itens : itens.slice(0, visiveisPadrao);

  return (
    <div>
      <p className="text-sm font-semibold text-gray-600 mb-1">{titulo}</p>
      {descricao && <p className="text-xs text-gray-400 mb-3">{descricao}</p>}
      {/* Sem overflow no <ol>: recortaria o painel que abre no hover de cada linha. */}
      <ol className="space-y-2">
        {exibidos.map((item, idx) => (
          <LinhaRanking
            key={item.nome}
            item={item}
            posicao={idx + 1}
            corBadge={corBadge}
          />
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

/**
 * Faixa do "Por Etapa": Atendimento (sem etapa), Reservado, cada etapa do fluxo e a final. Os
 * cards de Situação Atual e as barras do gráfico mostram o mesmo recorte, então a chave, a cor e
 * o texto saem daqui para os dois nunca se desencontrarem.
 */
const chaveFaixaEtapa = (item) => `${item.etapaId ?? 'atendimento'}${item.reservado ? '-reservado' : ''}`;

function aparenciaFaixaEtapa(item) {
  if (item.etapaId == null) {
    return { icone: Inbox, corIcone: 'text-slate-600', corFundo: 'bg-slate-100', corBarra: '#94a3b8', descricao: 'Tarefas ainda sem etapa definida.' };
  }
  if (item.reservado) {
    return { icone: Bookmark, corIcone: 'text-amber-600', corFundo: 'bg-amber-50', corBarra: '#f59e0b', descricao: 'Na elaboração, mas ainda não iniciadas.' };
  }
  if (item.ehEtapaFinal) {
    return { icone: CheckCircle2, corIcone: 'text-emerald-600', corFundo: 'bg-emerald-50', corBarra: '#10b981', descricao: 'Na etapa final, com o projeto ainda aberto.' };
  }
  return {
    icone: ClipboardList,
    corIcone: 'text-violet-600',
    corFundo: 'bg-violet-50',
    corBarra: '#8b5cf6',
    descricao: ehEtapaElaboracao(item.etapa) ? 'Já iniciadas ou pausadas nesta etapa.' : 'Tarefas nesta etapa agora.',
  };
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
              description: 'Agendados hoje, pendentes e realizados no período, e os que passaram do prazo. <strong>Passe o mouse</strong> em qualquer card para ver a lista. <strong>Clique</strong> para fixá-la e poder rolar; clique fora para soltar.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-tarefas-situacao',
            popover: {
              title: 'Tarefas — Situação Atual',
              description: 'Um card por etapa, no mesmo recorte do gráfico <strong>Por Etapa</strong>: Atendimento, Reservado, cada etapa do fluxo e a final. Tarefas sem responsável ficam em Alertas. Cada lista mostra <strong>responsável</strong>, <strong>etapa</strong>, <strong>status</strong> e <strong>quem mexeu por último, quando</strong>.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#tour-dashboard-tarefas-etapas',
            popover: {
              title: 'Tarefas — Distribuição',
              description: 'Como as tarefas se distribuem por <strong>etapa</strong>, <strong>prioridade</strong> e <strong>colaborador</strong>. <strong>Passe o mouse</strong> em qualquer barra para ver as tarefas dela. <strong>Clique</strong> para fixar a lista; clique fora para soltar.',
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

  // Visão global = admin sem filtro de colaborador. Fora dela, a tela é o painel de UMA pessoa:
  // comparação entre colaboradores (carga, rankings) é dado de terceiros e não entra.
  const visaoGlobal = ehAdministrador && !filtro;

  // Denominador das barras: a soma das próprias faixas. Usar um "total de tarefas" separado fazia
  // os percentuais não fecharem em 100%.
  const totalPorEtapa = tarefas.porEtapa.reduce((acc, item) => acc + item.total, 0);
  const totalPorPrioridade = tarefas.porPrioridade.reduce((acc, item) => acc + item.total, 0);
  const cargaPorColaborador = visaoGlobal ? (tarefas.cargaPorColaborador ?? []) : [];
  const cargaMaxima = Math.max(...cargaPorColaborador.map((c) => c.total), 1);

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
            descricao="Atendimentos agendados para hoje e ainda em aberto."
            indicador={atendimentos.hoje}
            corIcone="text-blue-600"
            corFundo="bg-blue-50"
          />
          <CardKPI
            icone={CalendarClock}
            titulo={`Pendentes (${rotuloPeriodo})`}
            descricao="Atendimentos agendados no período e ainda em aberto."
            indicador={atendimentos.pendentesPeriodo}
            corIcone="text-amber-600"
            corFundo="bg-amber-50"
          />
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso"
            descricao="Atendimentos cuja hora de término já passou e seguem em aberto."
            indicador={atendimentos.emAtraso}
            corIcone="text-red-600"
            corFundo="bg-red-50"
            destaque={atendimentos.emAtraso.total > 0}
          />
          <CardKPI
            icone={CheckCircle2}
            titulo={`Realizados (${rotuloPeriodo})`}
            descricao="Atendimentos concluídos no período."
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
            <p className="text-xs text-gray-400 mt-0.5 mb-2">Atendimentos concluídos por mês.</p>
            <GraficoTendencia tendencia={atendimentos.tendencia} />
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-500" />
              Próximos Atendimentos
            </p>
              <p className="text-xs text-gray-400 -mt-2 mb-3">Os 5 próximos atendimentos agendados.</p>
            <ProximosAtendimentos itens={atendimentos.proximos} />
          </div>
        </div>
      </section>

      {/* ───── TAREFAS: SITUAÇÃO ATUAL ───── */}
      <section id="tour-dashboard-tarefas-situacao">
        <TituloSecao icone={ClipboardList} cor="text-violet-500">
          Tarefas — Situação Atual · {tituloSecao}
        </TituloSecao>

        {/* Mesmo recorte do gráfico "Por Etapa", em cards: um por faixa. */}
        {tarefas.porEtapa.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma tarefa nas etapas do fluxo.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {tarefas.porEtapa.map((item) => {
              const aparencia = aparenciaFaixaEtapa(item);
              return (
                <CardKPI
                  key={chaveFaixaEtapa(item)}
                  icone={aparencia.icone}
                  titulo={item.etapa}
                  descricao={aparencia.descricao}
                  indicador={{ total: item.total, itens: item.itens }}
                  corIcone={aparencia.corIcone}
                  corFundo={aparencia.corFundo}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ───── TAREFAS: ALERTAS ───── */}
      <section>
        <TituloSecao icone={AlertTriangle} cor="text-red-500">
          Tarefas — Alertas
        </TituloSecao>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${visaoGlobal ? 'lg:grid-cols-3' : ''}`}>
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso — Execução"
            descricao="Tempo de elaboração acima do previsto na tarefa."
            indicador={tarefas.execucaoEmAtraso}
            corIcone={tarefas.execucaoEmAtraso.total > 0 ? 'text-red-600' : 'text-gray-400'}
            corFundo={tarefas.execucaoEmAtraso.total > 0 ? 'bg-red-50' : 'bg-gray-100'}
            destaque={tarefas.execucaoEmAtraso.total > 0}
          />
          <CardKPI
            icone={AlertTriangle}
            titulo="Em Atraso — Teste"
            descricao="Tempo na etapa de teste acima do previsto na tarefa."
            indicador={tarefas.testeEmAtraso}
            corIcone={tarefas.testeEmAtraso.total > 0 ? 'text-blue-600' : 'text-gray-400'}
            corFundo={tarefas.testeEmAtraso.total > 0 ? 'bg-blue-50' : 'bg-gray-100'}
            destaque={tarefas.testeEmAtraso.total > 0}
          />
          {visaoGlobal && (
            <CardKPI
              icone={UserMinus}
              titulo="Sem Responsável"
              descricao="Tarefas já em uma etapa do fluxo e sem colaborador atribuído."
              indicador={tarefas.semResponsavel}
              corIcone={tarefas.semResponsavel.total > 0 ? 'text-orange-500' : 'text-gray-400'}
              corFundo={tarefas.semResponsavel.total > 0 ? 'bg-orange-50' : 'bg-gray-100'}
              destaque={tarefas.semResponsavel.total > 0}
            />
          )}
        </div>
      </section>

      {/* ───── TAREFAS: DISTRIBUIÇÃO ───── */}
      <section id="tour-dashboard-tarefas-etapas">
        <TituloSecao icone={ClipboardList} cor="text-violet-500">
          Tarefas — Distribuição
        </TituloSecao>

        <div className={`grid grid-cols-1 gap-4 ${visaoGlobal ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-1">Por Etapa</p>
            <p className="text-xs text-gray-400 mb-4">Onde as tarefas estão no fluxo.</p>
            {tarefas.porEtapa.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa em andamento.</p>
              : tarefas.porEtapa.map((item) => (
                <BarraHorizontal
                  key={chaveFaixaEtapa(item)}
                  label={item.etapa}
                  valor={item.total}
                  total={totalPorEtapa}
                  cor={aparenciaFaixaEtapa(item).corBarra}
                  itens={item.itens}
                  totalItens={item.total}
                />
              ))
            }
          </div>

          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-1">Por Prioridade</p>
            <p className="text-xs text-gray-400 mb-4">Prioridade das tarefas que ainda não chegaram na etapa final.</p>
            {tarefas.porPrioridade.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa em andamento.</p>
              : tarefas.porPrioridade.map((item) => (
                <BarraHorizontal
                  key={item.prioridade}
                  label={item.prioridade}
                  valor={item.total}
                  total={totalPorPrioridade}
                  cor={item.cor}
                  itens={item.itens}
                  totalItens={item.total}
                />
              ))
            }
          </div>

          {visaoGlobal && (
          <div className="bg-white rounded-xl border p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-1">Carga por Colaborador</p>
            <p className="text-xs text-gray-400 mb-4">Tarefas abertas atribuídas hoje a cada pessoa.</p>
            {cargaPorColaborador.length === 0
              ? <p className="text-sm text-gray-400">Nenhuma tarefa atribuída.</p>
              : cargaPorColaborador.map((item) => (
                <BarraHorizontal
                  key={item.id}
                  label={item.nome}
                  valor={item.total}
                  total={cargaMaxima}
                  cor="#6366f1"
                  itens={item.itens}
                  totalItens={item.total}
                />
              ))
            }
          </div>
          )}
        </div>
      </section>

      {/* ───── PRODUÇÃO DO PERÍODO ───── */}
      <section id="tour-dashboard-producao">
        <TituloSecao icone={CheckCircle2} cor="text-emerald-500" sufixo={rotuloPeriodo}>
          Produção do Período
        </TituloSecao>

        <div className={`grid grid-cols-1 gap-4 ${visaoGlobal ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <CardKPI
            icone={ClipboardCheck}
            titulo="Tarefas Concluídas"
            descricao="Tarefas que chegaram na etapa final no período."
            indicador={tarefas.concluidasPeriodo}
            corIcone="text-emerald-600"
            corFundo="bg-emerald-50"
          />
          <CardKPI
            icone={CheckCircle2}
            titulo="Atendimentos Realizados"
            descricao="Atendimentos concluídos no período."
            indicador={atendimentos.realizadosPeriodo}
            corIcone="text-blue-600"
            corFundo="bg-blue-50"
          />
          {visaoGlobal && projetos && (
            <CardKPI
              icone={FolderCheck}
              titulo="Projetos Concluídos"
              descricao="Projetos concluídos no período."
              indicador={projetos.concluidosPeriodo}
              corIcone="text-teal-600"
              corFundo="bg-teal-50"
            />
          )}
        </div>

        {visaoGlobal && colaboradores && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <RankingColaboradores
                titulo="Tarefas Concluídas por Colaborador"
                descricao="Tarefas que chegaram na etapa final no período, por quem estava com a etapa."
                itens={colaboradores.tarefasConcluidasPeriodo}
                corBadge="bg-emerald-500"
              />
            </div>
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <RankingColaboradores
                titulo="Atendimentos Realizados por Colaborador"
                descricao="Atendimentos concluídos no período, por colaborador atribuído."
                itens={colaboradores.atendimentosPeriodo}
                corBadge="bg-blue-500"
              />
            </div>
          </div>
        )}
      </section>

      {/* ───── ADMIN: PROJETOS + RISCOS ───── */}
      {visaoGlobal && projetos && colaboradores && (
        <>
          <section>
            <TituloSecao icone={FolderOpen} cor="text-teal-500">
              Projetos
            </TituloSecao>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CardKPI
                icone={FolderOpen}
                titulo="Projetos Ativos"
                descricao="Projetos ativos e ainda não concluídos."
                indicador={projetos.ativos}
                corIcone="text-teal-600"
                corFundo="bg-teal-50"
              />
              <CardKPI
                icone={CalendarCheck}
                titulo={`Cadastrados (${rotuloPeriodo})`}
                descricao="Projetos criados no período."
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
                <p className="text-xs text-gray-400 mb-3">Projetos ativos sem nenhuma movimentação nas tarefas há mais de 15 dias.</p>
                <ProjetosSemMovimentacao itens={data.projetosSemMovimentacao} />
              </div>

              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserX className="h-4 w-4 text-gray-500" />
                  Colaboradores sem Tarefas Atribuídas
                </p>
                <p className="text-xs text-gray-400 mb-3">Colaboradores ativos sem nenhuma tarefa em projeto ativo.</p>
                <ColaboradoresOciosos itens={colaboradores.semTarefasAtribuidas} />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
