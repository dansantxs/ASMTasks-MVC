import React, { useEffect, useRef, useState } from 'react';
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
  Settings,
  LogOut,
  KeyRound,
  ShieldCheck,
  SlidersHorizontal,
  Bell,
  Check,
} from 'lucide-react';
import { cn } from '../../ui/form/utils';
import { Button } from '../../ui/base/button';
import { cadastroItems, relatorioItems } from '../config/menuItems';
import { hasPermission, screenPermissions } from '../auth/permissions';
import { defaultNotificationListResponse, getNotifications, markNotificationAsRead } from '../notifications/api';
import { toast } from 'sonner';

function formatDateTime(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Sidebar({ currentPath, onNavigate, onToggleCollapse, colaboradorNome, permissoes, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cadastrosExpanded, setCadastrosExpanded] = useState(false);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(false);
  const [configuracoesExpanded, setConfiguracoesExpanded] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const notifiedUnreadIdsRef = useRef(new Set());
  const hasInitializedUnreadTrackerRef = useRef(false);

  const queryClient = useQueryClient();

  const { data: notificationsData = defaultNotificationListResponse, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['sidebar-notifications'],
    queryFn: () => getNotifications(50),
    refetchInterval: 30000,
    staleTime: 10000,
  });

  const markNotificationAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sidebar-notifications'] });
    },
    onSettled: () => {
      setMarkingNotificationId(null);
    },
  });

  const unreadNotificationsCount = notificationsData.quantidadeNaoLidas ?? 0;
  const notifications = notificationsData.itens ?? [];

  useEffect(() => {
    const unreadNotifications = notifications.filter((item) => !item.lida);
    const alreadyTracked = notifiedUnreadIdsRef.current;

    // Primeira carga: apenas memoriza as pendentes para nao disparar toast retroativo.
    if (!hasInitializedUnreadTrackerRef.current) {
      unreadNotifications.forEach((item) => alreadyTracked.add(item.id));
      hasInitializedUnreadTrackerRef.current = true;
      return;
    }

    unreadNotifications.forEach((item) => {
      if (alreadyTracked.has(item.id)) return;

      alreadyTracked.add(item.id);
      toast(item.titulo || 'Lembrete de atendimento', {
        description: item.mensagem || 'Voce recebeu uma nova notificacao.',
      });
    });

    const allIds = new Set(notifications.map((item) => item.id));
    for (const trackedId of Array.from(alreadyTracked)) {
      if (!allIds.has(trackedId)) alreadyTracked.delete(trackedId);
    }
  }, [notifications]);

  const handleMarkNotificationAsRead = (id) => {
    setMarkingNotificationId(id);
    markNotificationAsReadMutation.mutate(id);
  };

  const session = { permissoes };
  const cadastrosDisponiveis = cadastroItems.filter((item) => hasPermission(session, item.permission));
  const relatoriosDisponiveis = relatorioItems.filter((item) => hasPermission(session, item.permission));
  const podeVerAtendimento = hasPermission(session, screenPermissions.atendimentosAgenda);
  const podeVerProjetos = hasPermission(session, screenPermissions.projetosCadastro);
  const podeVerMinhaConta = hasPermission(session, screenPermissions.configuracoesMinhaConta);
  const podeVerAcessos = hasPermission(session, screenPermissions.configuracoesAcessos);
  const podeVerSistema = hasPermission(session, screenPermissions.configuracoesSistema);

  const setCollapsedState = (newState) => {
    setIsCollapsed(newState);
    onToggleCollapse?.(newState);
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setCollapsedState(newState);
    setCadastrosExpanded(false);
    setRelatoriosExpanded(false);
    setConfiguracoesExpanded(false);
    setNotificationsOpen(false);
  };

  const pathParts = currentPath.split('/');
  const currentSection = pathParts[1] || 'inicio';
  const currentKey = pathParts[2] || currentSection;
  const isCadastros = currentSection === 'cadastros';
  const isRelatorios = currentSection === 'relatorios';
  const isAtendimentos = currentSection === 'atendimentos';
  const isProjetos = currentSection === 'projetos';
  const isConfiguracoes = currentSection === 'configuracoes';

  return (
    <div
      className={cn(
        'fixed top-0 left-0 bg-[#0f172a] text-white h-screen flex flex-col border-r border-gray-800 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
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
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white hover:bg-gray-800 ml-auto"
        >
          {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
        </Button>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        <button
          onClick={() => onNavigate('/')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            currentSection === 'inicio' ? 'bg-[#1e3a8a] text-white' : 'text-gray-300 hover:bg-gray-800',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Inicio' : undefined}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Inicio</span>}
        </button>

        {cadastrosDisponiveis.length > 0 && (
          <div>
            <button
              onClick={() => {
                if (isCollapsed) {
                  setCollapsedState(false);
                  setCadastrosExpanded(true);
                } else {
                  setCadastrosExpanded(!cadastrosExpanded);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isCadastros ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? 'Cadastros' : undefined}
            >
              <Layers className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Cadastros</span>
                  {cadastrosExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {cadastrosExpanded && !isCollapsed && (
              <div className="ml-4 mt-1 space-y-1">
                {cadastrosDisponiveis.map((item) => {
                  const Icon = item.icon;
                  const isActive = isCadastros && currentKey === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onNavigate(`/cadastros/${item.key}`)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                        isActive ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      <Icon className="h-4 w-4" />
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
            onClick={() => onNavigate('/atendimentos/agenda')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isAtendimentos ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Atendimento' : undefined}
          >
            <CalendarDays className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Atendimento</span>}
          </button>
        )}

        {podeVerProjetos && (
          <button
            onClick={() => onNavigate('/projetos')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isProjetos ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Projetos' : undefined}
          >
            <FolderKanban className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>Projetos</span>}
          </button>
        )}

        {relatoriosDisponiveis.length > 0 && (
          <div>
            <button
              onClick={() => {
                if (isCollapsed) {
                  setCollapsedState(false);
                  setRelatoriosExpanded(true);
                } else {
                  setRelatoriosExpanded(!relatoriosExpanded);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isRelatorios ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? 'Relatorios' : undefined}
            >
              <BarChart3 className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Relatorios</span>
                  {relatoriosExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {relatoriosExpanded && !isCollapsed && (
              <div className="ml-4 mt-1 space-y-1">
                {relatoriosDisponiveis.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRelatorios && currentKey === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => onNavigate(`/relatorios/${item.key}`)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                        isActive ? 'bg-teal-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      )}
                    >
                      <Icon className="h-4 w-4" />
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
                if (isCollapsed) {
                  setCollapsedState(false);
                  setConfiguracoesExpanded(true);
                } else {
                  setConfiguracoesExpanded(!configuracoesExpanded);
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isConfiguracoes ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800',
                isCollapsed && 'justify-center px-2'
              )}
              title={isCollapsed ? 'Configuracoes' : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Configuracoes</span>
                  {configuracoesExpanded ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                </>
              )}
            </button>

            {configuracoesExpanded && !isCollapsed && (
              <div className="ml-4 mt-1 space-y-1">
                {podeVerMinhaConta && (
                  <button
                    onClick={() => onNavigate('/configuracoes/alterar-senha')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      currentPath === '/configuracoes/alterar-senha'
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
                    onClick={() => onNavigate('/configuracoes/acessos')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      currentPath === '/configuracoes/acessos'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Niveis e Usuarios</span>
                  </button>
                )}
                {podeVerSistema && (
                  <button
                    onClick={() => onNavigate('/configuracoes/sistema')}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm',
                      currentPath === '/configuracoes/sistema'
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                    )}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Parametrizacao</span>
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
          onClick={() => setNotificationsOpen((prev) => !prev)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-800 hover:text-white relative',
            isCollapsed && 'justify-center px-2'
          )}
          title={isCollapsed ? 'Notificacoes' : undefined}
        >
          <Bell className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span className="flex-1 text-left">Notificacoes</span>}
          {unreadNotificationsCount > 0 && (
            <span
              className={cn(
                'inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 text-white text-xs px-1.5',
                isCollapsed ? 'absolute top-1.5 right-1.5' : ''
              )}
            >
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          )}
        </button>

        {notificationsOpen && (
          <div
            className="absolute left-full bottom-0 ml-3 z-50 w-[430px] max-w-[calc(100vw-6rem)] rounded-xl border border-gray-200 bg-white text-slate-900 shadow-2xl overflow-hidden isolate"
            style={{
              background: 'rgb(255, 255, 255)',
              opacity: 1,
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              filter: 'none',
              mixBlendMode: 'normal',
            }}
          >
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium">Notificacoes</h3>
              <span className="text-xs text-gray-500">{unreadNotificationsCount} nao lida(s)</span>
            </div>

            <div className="max-h-[65vh] overflow-y-auto">
              {isLoadingNotifications && (
                <div className="px-4 py-6 text-sm text-gray-500">Carregando notificacoes...</div>
              )}

              {!isLoadingNotifications && notifications.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">Nenhuma notificacao recebida ate o momento.</div>
              )}

              {!isLoadingNotifications &&
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 border-b border-gray-100',
                      !notification.lida && 'bg-slate-50'
                    )}
                  >
                    <p className="text-sm font-medium text-slate-900">{notification.titulo}</p>
                    <p className="text-sm text-gray-600 mt-1">{notification.mensagem}</p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(notification.dataNotificacao)}
                      </span>

                      {notification.lida ? (
                        <span className="text-xs font-medium text-emerald-600">Lida</span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            markNotificationAsReadMutation.isPending &&
                            markingNotificationId === notification.id
                          }
                          onClick={() => handleMarkNotificationAsRead(notification.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {markNotificationAsReadMutation.isPending &&
                          markingNotificationId === notification.id
                            ? 'Marcando...'
                            : 'Marcar como lida'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-gray-400 text-xs mb-3 truncate" title={colaboradorNome}>
            {colaboradorNome ? `Logado: ${colaboradorNome}` : 'Usuario logado'}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            onClick={onLogout}
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

Sidebar.propTypes = {
  currentPath: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
  onToggleCollapse: PropTypes.func,
  colaboradorNome: PropTypes.string,
  permissoes: PropTypes.arrayOf(PropTypes.string),
  onLogout: PropTypes.func.isRequired,
};
