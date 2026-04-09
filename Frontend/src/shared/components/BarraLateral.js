import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Home,
  ChevronDown,
  ChevronRight,
  Layers,
  Menu,
  X,
  BarChart3,
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  Settings,
  LogOut,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Check,
  Folder,
} from 'lucide-react';
import { cn } from '../../ui/form/utils';
import { Button } from '../../ui/base/button';
import { cadastroItems, relatorioItems } from '../config/menuItems';
import { temPermissao, permissoesTelas } from '../auth/permissions';
import { respostaPadraoNotificacoes, buscarNotificacoes, marcarNotificacaoLida } from '../notificacoes/api';
import { toast } from 'sonner';

function formatarDataHora(valor) {
  if (!valor) return '-';

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BarraLateral({ caminhoAtual, aoNavegar, aoAlternarRecolhimento, colaboradorNome, permissoes, aoSair }) {
  const [recolhido, setRecolhido] = useState(false);
  const [cadastrosExpandido, setCadastrosExpandido] = useState(false);
  const [relatoriosExpandido, setRelatoriosExpandido] = useState(false);
  const [configuracoesExpandido, setConfiguracoesExpandido] = useState(false);
  const [projetosExpandido, setProjetosExpandido] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const [idNotificacaoSendoMarcada, setIdNotificacaoSendoMarcada] = useState(null);
  const [montado, setMontado] = useState(false);
  const idsNaoLidasNotificadasRef = useRef(new Set());
  const rastreadorInicializadoRef = useRef(false);

  useEffect(() => { setMontado(true); }, []);

  const queryClient = useQueryClient();

  const { data: dadosNotificacoes = respostaPadraoNotificacoes, isLoading: carregandoNotificacoes } = useQuery({
    queryKey: ['notificacoes-barra-lateral'],
    queryFn: () => buscarNotificacoes(50),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const mutacaoMarcarComoLida = useMutation({
    mutationFn: marcarNotificacaoLida,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificacoes-barra-lateral'] });
    },
    onSettled: () => {
      setIdNotificacaoSendoMarcada(null);
    },
  });

  const quantidadeNaoLidas = dadosNotificacoes.quantidadeNaoLidas ?? 0;
  const notificacoes = dadosNotificacoes.itens ?? [];

  useEffect(() => {
    const naoLidas = notificacoes.filter((item) => !item.lida);
    const jaRastreadas = idsNaoLidasNotificadasRef.current;

    if (!rastreadorInicializadoRef.current) {
      naoLidas.forEach((item) => jaRastreadas.add(item.id));
      rastreadorInicializadoRef.current = true;
      return;
    }

    naoLidas.forEach((item) => {
      if (jaRastreadas.has(item.id)) return;

      jaRastreadas.add(item.id);
      toast(item.titulo || 'Lembrete de atendimento', {
        description: item.mensagem || 'Você recebeu uma nova notificação.',
      });
    });

    const todosIds = new Set(notificacoes.map((item) => item.id));
    for (const idRastreado of Array.from(jaRastreadas)) {
      if (!todosIds.has(idRastreado)) jaRastreadas.delete(idRastreado);
    }
  }, [notificacoes]);

  const handleMarcarComoLida = (id) => {
    setIdNotificacaoSendoMarcada(id);
    mutacaoMarcarComoLida.mutate(id);
  };

  const sessao = { permissoes };
  const cadastrosDisponiveis = cadastroItems.filter((item) => temPermissao(sessao, item.permission));
  const relatoriosDisponiveis = relatorioItems.filter((item) => temPermissao(sessao, item.permission));
  const podeVerAtendimento = temPermissao(sessao, permissoesTelas.atendimentosAgenda);
  const podeVerProjetos = temPermissao(sessao, permissoesTelas.projetosCadastro);
  const podeVerKanban = temPermissao(sessao, permissoesTelas.projetosKanban);
  const podeVerMenuProjetos = podeVerProjetos || podeVerKanban;
  const podeVerMinhaConta = temPermissao(sessao, permissoesTelas.configuracoesMinhaConta);
  const podeVerAcessos = temPermissao(sessao, permissoesTelas.configuracoesAcessos);
  const podeVerSistema = temPermissao(sessao, permissoesTelas.configuracoesSistema);

  const definirEstadoRecolhido = (novoEstado) => {
    setRecolhido(novoEstado);
    aoAlternarRecolhimento?.(novoEstado);
  };

  const alternarBarraLateral = () => {
    const novoEstado = !recolhido;
    definirEstadoRecolhido(novoEstado);
    setCadastrosExpandido(false);
    setRelatoriosExpandido(false);
    setConfiguracoesExpandido(false);
    setProjetosExpandido(false);
    setNotificacoesAbertas(false);
  };

  const partesCaminho = caminhoAtual.split('/');
  const secaoAtual = partesCaminho[1] || 'inicio';
  const chaveAtual = partesCaminho[2] || secaoAtual;
  const isCadastros = secaoAtual === 'cadastros';
  const isRelatorios = secaoAtual === 'relatorios';
  const isAtendimentos = secaoAtual === 'atendimentos';
  const isProjetos = secaoAtual === 'projetos';
  const isConfiguracoes = secaoAtual === 'configuracoes';

  return (
    <div
      className={cn(
        'fixed top-0 left-0 bg-[#0f172a] text-white h-screen flex flex-col border-r border-gray-800 transition-all duration-300',
        recolhido ? 'w-20' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!recolhido && (
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-white">ASM Tasks</h2>
              <p className="text-gray-400 text-sm mt-1">Gerenciamento de Tarefas</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={alternarBarraLateral}
          className="text-gray-400 hover:text-white hover:bg-gray-800 ml-auto"
        >
          {recolhido ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        <button
          onClick={() => aoNavegar('/dashboard')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            secaoAtual === 'dashboard' ? 'bg-[#1e3a8a] text-white' : 'text-gray-300 hover:bg-gray-800',
            recolhido && 'justify-center px-2'
          )}
          title={recolhido ? 'Início' : undefined}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!recolhido && <span>Início</span>}
        </button>

        {cadastrosDisponiveis.length > 0 && (
          <div>
            <button
              onClick={() => {
                if (recolhido) {
                  definirEstadoRecolhido(false);
                  setCadastrosExpandido(true);
                } else {
                  setCadastrosExpandido(!cadastrosExpandido);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isCadastros ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                recolhido && 'justify-center px-2'
              )}
              title={recolhido ? 'Cadastros' : undefined}
            >
              <Layers className="h-5 w-5 flex-shrink-0" />
              {!recolhido && (
                <>
                  <span className="flex-1 text-left">Cadastros</span>
                  {cadastrosExpandido ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {cadastrosExpandido && !recolhido && (
              <div className="ml-4 mt-1 space-y-1">
                {cadastrosDisponiveis.map((item) => {
                  const Icone = item.icon;
                  const ativo = isCadastros && chaveAtual === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => aoNavegar(`/cadastros/${item.key}`)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                        ativo ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      <Icone className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {podeVerAtendimento && (
          <button
            onClick={() => aoNavegar('/atendimentos')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isAtendimentos ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
              recolhido && 'justify-center px-2'
            )}
            title={recolhido ? 'Atendimento' : undefined}
          >
            <CalendarDays className="h-5 w-5 flex-shrink-0" />
            {!recolhido && <span>Atendimento</span>}
          </button>
        )}

        {podeVerMenuProjetos && (
          <div>
            <button
              onClick={() => {
                if (recolhido) {
                  definirEstadoRecolhido(false);
                  setProjetosExpandido(true);
                } else {
                  setProjetosExpandido(!projetosExpandido);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isProjetos ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                recolhido && 'justify-center px-2'
              )}
              title={recolhido ? 'Projetos' : undefined}
            >
              <FolderKanban className="h-5 w-5 flex-shrink-0" />
              {!recolhido && (
                <>
                  <span className="flex-1 text-left">Projetos</span>
                  {projetosExpandido ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {projetosExpandido && !recolhido && (
              <div className="ml-4 mt-1 space-y-1">
                {podeVerProjetos && (
                  <button
                    onClick={() => aoNavegar('/projetos')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      isProjetos && chaveAtual !== 'kanban'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <Folder className="h-4 w-4" />
                    <span>Cadastro</span>
                  </button>
                )}
                {podeVerKanban && (
                  <button
                    onClick={() => aoNavegar('/projetos/kanban')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      isProjetos && chaveAtual === 'kanban'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Quadro Kanban</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {relatoriosDisponiveis.length > 0 && (
          <div>
            <button
              onClick={() => {
                if (recolhido) {
                  definirEstadoRecolhido(false);
                  setRelatoriosExpandido(true);
                } else {
                  setRelatoriosExpandido(!relatoriosExpandido);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isRelatorios ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                recolhido && 'justify-center px-2'
              )}
              title={recolhido ? 'Relatórios' : undefined}
            >
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              {!recolhido && (
                <>
                  <span className="flex-1 text-left">Relatórios</span>
                  {relatoriosExpandido ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {relatoriosExpandido && !recolhido && (
              <div className="ml-4 mt-1 space-y-1">
                {relatoriosDisponiveis.map((item) => {
                  const Icone = item.icon;
                  const ativo = isRelatorios && chaveAtual === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => aoNavegar(`/relatorios/${item.key}`)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                        ativo ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      <Icone className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(podeVerMinhaConta || podeVerAcessos || podeVerSistema) && (
          <div>
            <button
              onClick={() => {
                if (recolhido) {
                  definirEstadoRecolhido(false);
                  setConfiguracoesExpandido(true);
                } else {
                  setConfiguracoesExpandido(!configuracoesExpandido);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isConfiguracoes ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                recolhido && 'justify-center px-2'
              )}
              title={recolhido ? 'Configurações' : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!recolhido && (
                <>
                  <span className="flex-1 text-left">Configurações</span>
                  {configuracoesExpandido ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {configuracoesExpandido && !recolhido && (
              <div className="ml-4 mt-1 space-y-1">
                {podeVerMinhaConta && (
                  <button
                    onClick={() => aoNavegar('/configuracoes/alterar-senha')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      caminhoAtual === '/configuracoes/alterar-senha'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>Minha Conta</span>
                  </button>
                )}
                {podeVerAcessos && (
                  <button
                    onClick={() => aoNavegar('/configuracoes/acessos')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      caminhoAtual === '/configuracoes/acessos'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Níveis e Usuários</span>
                  </button>
                )}
                {podeVerSistema && (
                  <button
                    onClick={() => aoNavegar('/configuracoes/sistema')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      caminhoAtual === '/configuracoes/sistema'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Parametrização</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="relative p-4 border-t border-gray-800">
        <button
          type="button"
          onClick={() => setNotificacoesAbertas((prev) => !prev)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white relative',
            recolhido && 'justify-center px-2'
          )}
          title={recolhido ? 'Notificações' : undefined}
        >
          <Bell className="h-5 w-5 flex-shrink-0" />
          {!recolhido && <span className="flex-1 text-left">Notificações</span>}
          {quantidadeNaoLidas > 0 && (
            <span
              className={cn(
                'inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 text-white text-xs px-1.5',
                recolhido ? 'absolute top-1.5 right-1.5' : ''
              )}
            >
              {quantidadeNaoLidas > 99 ? '99+' : quantidadeNaoLidas}
            </span>
          )}
        </button>

        {notificacoesAbertas && montado && createPortal(
          <div
            className="w-[430px] max-w-[calc(100vw-6rem)] rounded-xl border border-gray-200 bg-white text-slate-900 shadow-2xl overflow-hidden"
            style={{
              position: 'fixed',
              left: recolhido ? 'calc(5rem + 0.75rem)' : 'calc(16rem + 0.75rem)',
              bottom: '1rem',
              zIndex: 9999,
            }}
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium">Notificações</h3>
              <span className="text-xs text-gray-500">{quantidadeNaoLidas} não lida(s)</span>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              {carregandoNotificacoes && (
                <div className="px-4 py-6 text-sm text-gray-500">Carregando notificações...</div>
              )}

              {!carregandoNotificacoes && notificacoes.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">Nenhuma notificação recebida até o momento.</div>
              )}

              {!carregandoNotificacoes &&
                notificacoes.map((notificacao) => (
                  <div
                    key={notificacao.id}
                    className={cn(
                      'px-4 py-3 border-b border-gray-100',
                      !notificacao.lida && 'bg-slate-50'
                    )}
                  >
                    <p className="text-sm font-medium text-slate-900">{notificacao.titulo}</p>
                    <p className="text-sm text-gray-600 mt-1">{notificacao.mensagem}</p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">
                        {formatarDataHora(notificacao.dataNotificacao)}
                      </span>

                      {notificacao.lida ? (
                        <span className="text-xs font-medium text-emerald-600">Lida</span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            mutacaoMarcarComoLida.isPending &&
                            idNotificacaoSendoMarcada === notificacao.id
                          }
                          onClick={() => handleMarcarComoLida(notificacao.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {mutacaoMarcarComoLida.isPending &&
                          idNotificacaoSendoMarcada === notificacao.id
                            ? 'Marcando...'
                            : 'Marcar como lida'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>,
          document.body
        )}
      </div>

      {!recolhido && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-gray-400 text-xs mb-3 truncate" title={colaboradorNome}>
            {colaboradorNome ? `Logado: ${colaboradorNome}` : 'Usuário logado'}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={aoSair}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
          <p className="text-gray-500 text-xs text-center mt-3">v1.0.0</p>
        </div>
      )}
    </div>
  );
}

BarraLateral.propTypes = {
  caminhoAtual: PropTypes.string.isRequired,
  aoNavegar: PropTypes.func.isRequired,
  aoAlternarRecolhimento: PropTypes.func,
  colaboradorNome: PropTypes.string,
  permissoes: PropTypes.arrayOf(PropTypes.string),
  aoSair: PropTypes.func.isRequired,
};
