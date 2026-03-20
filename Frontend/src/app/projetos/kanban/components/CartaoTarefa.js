'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, User, Folder, Building2, Eye } from 'lucide-react';
import { cn } from '../../../../ui/form/utils';

export default function CartaoTarefa({ tarefa, podeMover, onVisualizar }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tarefa-${tarefa.id}`,
    data: { type: 'tarefa', tarefa },
    disabled: !podeMover,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const corBorda = tarefa.prioridadeCor ?? '#e5e7eb';

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, borderLeftColor: corBorda }}
      className={cn(
        'bg-white border border-l-4 border-gray-200 rounded-lg p-3 shadow-sm select-none',
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-brand-blue' : 'hover:shadow-md',
        podeMover ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        {podeMover && (
          <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium text-gray-900 leading-snug break-words flex-1">{tarefa.titulo}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onVisualizar?.(tarefa); }}
              className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors p-0.5 -mt-0.5 -mr-0.5"
              title="Visualizar detalhes"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>

          {tarefa.prioridadeNome && (
            <div className="mt-1.5">
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: corBorda }}
              >
                {tarefa.prioridadeNome}
              </span>
            </div>
          )}

          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500 truncate flex items-center gap-1" title={tarefa.projetoTitulo}>
              <Folder className="h-3 w-3 flex-shrink-0" />
              {tarefa.projetoTitulo}
            </p>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1" title={tarefa.clienteNome}>
              <Building2 className="h-3 w-3 flex-shrink-0" />
              {tarefa.clienteNome}
            </p>
          </div>

          <div className="mt-2 flex items-center gap-1">
            <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">
              {tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
