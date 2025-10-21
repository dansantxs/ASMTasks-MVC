import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Home, ChevronDown, ChevronRight, Layers, Menu, X, Building2, Flag, Workflow } from 'lucide-react';
import { cn } from '../ui/utils';
import { Button } from '../ui/button';

export function Sidebar({ currentPage, onNavigate }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cadastrosExpanded, setCadastrosExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    
    if (isCollapsed) {
      setCadastrosExpanded(true);
    }
  };

  return (
    <div
      className={cn(
        "bg-[#0f172a] text-white h-screen flex flex-col border-r border-gray-800 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h2 className="text-white">Sistema de Gestão</h2>
            <p className="text-gray-400 text-sm mt-1">Gerenciamento</p>
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

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Início */}
        <button
          onClick={() => onNavigate('inicio')}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            currentPage === 'inicio'
              ? "bg-[#1e3a8a] text-white"
              : "text-gray-300 hover:bg-gray-800",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? "Início" : undefined}
        >
          <Home className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Início</span>}
        </button>

        {/* Cadastros */}
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setCadastrosExpanded(true);
              } else {
                setCadastrosExpanded(!cadastrosExpanded);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
              ['setores', 'prioridades', 'etapas'].includes(currentPage)
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

          {/* Submenu */}
          {cadastrosExpanded && !isCollapsed && (
            <div className="ml-4 mt-1 space-y-1">
              <button
                onClick={() => onNavigate('setores')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                  currentPage === 'setores'
                    ? "bg-[#1e3a8a] text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <Building2 className="h-4 w-4" />
                <span>Setores</span>
              </button>

              <button
                onClick={() => onNavigate('prioridades')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                  currentPage === 'prioridades'
                    ? "bg-[#1e3a8a] text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <Flag className="h-4 w-4" />
                <span>Prioridades</span>
              </button>

              <button
                onClick={() => onNavigate('etapas')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm",
                  currentPage === 'etapas'
                    ? "bg-[#1e3a8a] text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                )}
              >
                <Workflow className="h-4 w-4" />
                <span>Etapas</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Footer - opcional, pode mostrar versão ou usuário */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-gray-500 text-xs text-center">v1.0.0</p>
        </div>
      )}
    </div>
  );
}

Sidebar.propTypes = {
  currentPage: PropTypes.oneOf(['inicio', 'setores', 'prioridades', 'etapas']).isRequired,
  onNavigate: PropTypes.func.isRequired,
};