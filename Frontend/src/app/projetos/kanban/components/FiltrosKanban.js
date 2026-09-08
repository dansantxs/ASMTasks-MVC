'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Filter, ChevronDown, X, Check, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../../../components/ui/base/button';
import { cn } from '../../../../components/ui/form/utils';

const opcoesOrdenacao = [
  { id: 'prioridade', label: 'Prioridade' },
  { id: 'lancamento', label: 'Lançamento' },
];

// Em Prioridade, ordem 1 é a mais alta — por isso "crescente" significa "mais urgente primeiro".
const rotuloDirecao = ({ ordenacao, direcao }) =>
  ordenacao === 'lancamento'
    ? (direcao === 'asc' ? 'Mais antigas primeiro' : 'Mais recentes primeiro')
    : (direcao === 'asc' ? 'Maior prioridade primeiro' : 'Menor prioridade primeiro');

const DIACRITICOS = /[̀-ͯ]/g;
const normalizar = (texto) => (texto ?? '').normalize('NFD').replace(DIACRITICOS, '').toLowerCase();

function MultiSelectDropdown({ label, items, selectedIds, onChange, emptyLabel }) {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) {
      setFiltro('');
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const itemsFiltrados = useMemo(() => {
    const termo = normalizar(filtro).trim();
    if (!termo) return items;
    return items.filter((item) => normalizar(item.nome).includes(termo));
  }, [items, filtro]);

  const todosSelected = selectedIds.length === 0;

  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleTodos = () => onChange([]);

  const displayText = () => {
    if (todosSelected) return emptyLabel;
    if (selectedIds.length === 1) {
      const item = items.find((i) => i.id === selectedIds[0]);
      return item?.nome ?? emptyLabel;
    }
    return `${selectedIds.length} selecionados`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white',
          'hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-blue',
          !todosSelected && 'border-brand-blue bg-brand-blue/5'
        )}
      >
        <span className="text-gray-700 max-w-[140px] truncate">{label}: <span className={cn('font-medium', !todosSelected && 'text-brand-blue')}>{displayText()}</span></span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] max-h-72 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 border-b border-gray-100 px-2.5">
            <Search className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}...`}
              className="w-full py-2 text-sm bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
          <div className="overflow-y-auto py-1">
            <button
              type="button"
              onClick={toggleTodos}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
            >
              <span className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                todosSelected ? 'bg-brand-blue border-brand-blue' : 'border-gray-300'
              )}>
                {todosSelected && <Check className="h-3 w-3 text-white" />}
              </span>
              <span className="text-gray-700 font-medium">Todos</span>
            </button>
            <div className="border-t border-gray-100 my-1" />
            {itemsFiltrados.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-400 text-center">Nenhuma opção encontrada.</p>
            ) : (
              itemsFiltrados.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                  >
                    <span className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                      checked ? 'bg-brand-blue border-brand-blue' : 'border-gray-300'
                    )}>
                      {checked && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="text-gray-700 truncate">{item.nome}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FiltrosKanban({
  filtros,
  aoAlterarFiltros,
  colaboradorLogadoId,
  colaboradores,
  projetos,
  clientes,
  ehAdmin,
  ordenacao,
  aoAlterarOrdenacao,
}) {
  const { colaboradorIds, projetoIds, clienteIds } = filtros;

  // Para não-admins, o filtro de colaborador é "ativo" apenas quando difere do padrão (somente o próprio ID)
  const colaboradorFiltroAtivo = ehAdmin
    ? colaboradorIds.length > 0
    : !(colaboradorIds.length === 1 && colaboradorIds[0] === colaboradorLogadoId);

  const temFiltroAtivo =
    projetoIds.length > 0 ||
    clienteIds.length > 0 ||
    colaboradorFiltroAtivo;

  const limpar = () => {
    aoAlterarFiltros({
      colaboradorIds: ehAdmin ? [] : (colaboradorLogadoId ? [colaboradorLogadoId] : []),
      projetoIds: [],
      clienteIds: [],
    });
  };

  return (
    <div id="tour-kanban-filtros" className="flex flex-wrap items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
        <Filter className="h-4 w-4" />
        <span>Filtros</span>
      </div>

      <MultiSelectDropdown
        label="Colaborador"
        items={colaboradores}
        selectedIds={colaboradorIds}
        onChange={(ids) => aoAlterarFiltros({ ...filtros, colaboradorIds: ids })}
        emptyLabel="Todos"
      />

      <MultiSelectDropdown
        label="Projeto"
        items={projetos}
        selectedIds={projetoIds}
        onChange={(ids) => aoAlterarFiltros({ ...filtros, projetoIds: ids })}
        emptyLabel="Todos"
      />

      <MultiSelectDropdown
        label="Cliente"
        items={clientes}
        selectedIds={clienteIds}
        onChange={(ids) => aoAlterarFiltros({ ...filtros, clienteIds: ids })}
        emptyLabel="Todos"
      />

      <div className="flex items-center gap-1.5 ml-auto">
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-700">Ordenar por:</span>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {opcoesOrdenacao.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => aoAlterarOrdenacao({ ...ordenacao, ordenacao: opcao.id })}
              className={cn(
                'px-2.5 py-1.5 text-sm transition-colors',
                ordenacao.ordenacao === opcao.id
                  ? 'bg-brand-blue/10 text-brand-blue font-medium'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              {opcao.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => aoAlterarOrdenacao({ ...ordenacao, direcao: ordenacao.direcao === 'asc' ? 'desc' : 'asc' })}
          title={rotuloDirecao(ordenacao)}
          className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {ordenacao.direcao === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        </button>
      </div>
      {temFiltroAtivo && (
        <Button variant="ghost" size="sm" onClick={limpar} className="text-gray-500 hover:text-gray-700">
          <X className="h-3.5 w-3.5 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
