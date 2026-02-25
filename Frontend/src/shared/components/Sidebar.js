import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Home, ChevronDown, ChevronRight, Layers, Menu, X, BarChart3, CalendarDays, Settings, LogOut, KeyRound } from 'lucide-react';
import { cn } from '../../ui/form/utils';
import { Button } from '../../ui/base/button';
import { cadastroItems, relatorioItems } from "../config/menuItems";

export function Sidebar({ currentPath, onNavigate, onToggleCollapse, colaboradorNome, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cadastrosExpanded, setCadastrosExpanded] = useState(false);
  const [relatoriosExpanded, setRelatoriosExpanded] = useState(false);
  const [configuracoesExpanded, setConfiguracoesExpanded] = useState(false);

  const setCollapsedState = (newState) => {
    setIsCollapsed(newState);
    if (onToggleCollapse) {
      onToggleCollapse(newState);
    }
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setCollapsedState(newState);
    if (newState) {
      setCadastrosExpanded(false);
      setRelatoriosExpanded(false);
      setConfiguracoesExpanded(false);
    } else {
      setCadastrosExpanded(false);
      setRelatoriosExpanded(false);
      setConfiguracoesExpanded(false);
    }
  };

  const pathParts = currentPath.split('/');
  const currentSection = pathParts[1] || 'inicio';
  const currentKey = pathParts[2] || currentSection;
  const isCadastros = currentSection === 'cadastros';
  const isRelatorios = currentSection === 'relatorios';
  const isAtendimentos = currentSection === 'atendimentos';
  const isConfiguracoes = currentSection === 'configuracoes';

  return (
    <div
      className={cn(
        "fixed top-0 left-0 bg-[#0f172a] text-white h-screen flex flex-col border-r border-gray-800 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-white">ASM Tasks</h2>
            <p className="text-gray-400 text-sm mt-1">Gerenciamento de Tarefas</p>
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
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            currentSection === 'inicio'
              ? "bg-[#1e3a8a] text-white"
              : "text-gray-300 hover:bg-gray-800",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Início" : undefined}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Início</span>}
        </button>

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
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              isCadastros
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Cadastros" : undefined}
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
              {cadastroItems.map(item => {
                const Icon = item.icon;
                const isActive = isCadastros && currentKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(`/cadastros/${item.key}`)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-teal-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('/atendimentos/agenda')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            isAtendimentos
              ? "bg-gray-800 text-white"
              : "text-gray-300 hover:bg-gray-800",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Atendimento" : undefined}
        >
          <CalendarDays className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Atendimento</span>}
        </button>

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
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              isRelatorios
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Relatórios" : undefined}
          >
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Relatórios</span>
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
              {relatorioItems.map(item => {
                const Icon = item.icon;
                const isActive = isRelatorios && currentKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(`/relatorios/${item.key}`)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                      isActive
                        ? "bg-teal-600 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

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
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              isConfiguracoes
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Configuracoes" : undefined}
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
              <button
                onClick={() => onNavigate('/configuracoes/alterar-senha')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                  currentPath === '/configuracoes/alterar-senha'
                    ? "bg-teal-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <KeyRound className="h-4 w-4" />
                <span>Minha Conta</span>
              </button>
            </div>
          )}
        </div>
      </nav>

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
  onLogout: PropTypes.func.isRequired,
};
