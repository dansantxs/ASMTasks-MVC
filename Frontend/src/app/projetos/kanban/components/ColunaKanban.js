'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../../../../ui/form/utils';
import CartaoTarefa from './CartaoTarefa';

export default function ColunaKanban({ etapaId, titulo, tarefas, ehAdmin, colaboradorLogadoId, isBacklog, onVisualizarTarefa }) {
  const podeMoverTarefa = (tarefa) =>
    ehAdmin ||
    tarefa.colaboradorResponsavelId == null ||
    tarefa.colaboradorResponsavelId === colaboradorLogadoId;
  const podeReordenar = ehAdmin && !isBacklog;

  const {
    attributes: dragAttrs,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging: isColumnDragging,
  } = useDraggable({
    id: `coluna-${etapaId ?? 'backlog'}`,
    data: { type: 'coluna', etapaId },
    disabled: !podeReordenar,
  });

  const { setNodeRef: setColDropRef, isOver: isColOver } = useDroppable({
    id: `col-drop-${etapaId ?? 'backlog'}`,
    data: { type: 'coluna', etapaId },
  });

  const { setNodeRef: setTaskDropRef, isOver: isTaskOver } = useDroppable({
    id: `etapa-${etapaId ?? 'sem-etapa'}`,
    data: { type: 'tarefa', etapaId },
  });

  return (
    <div
      ref={(el) => { setDragRef(el); setColDropRef(el); }}
      style={isColumnDragging ? { opacity: 0.5 } : undefined}
      className={cn(
        'flex flex-col bg-gray-50 border border-gray-200 rounded-xl min-w-[280px] w-[280px] max-h-[calc(100vh-230px)] transition-colors',
        isColOver && !isColumnDragging && 'border-brand-blue bg-brand-blue/5'
      )}
      {...(podeReordenar ? dragAttrs : {})}
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-1.5 min-w-0">
          {podeReordenar && (
            <span
              {...dragListeners}
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
              title="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )}
          <h3 className="text-sm font-semibold text-gray-700 truncate">{titulo}</h3>
        </div>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-medium text-gray-600 flex-shrink-0">
          {tarefas.length}
        </span>
      </div>

      <div
        ref={setTaskDropRef}
        className={cn(
          'flex-1 overflow-y-auto p-3 space-y-2 transition-colors',
          isTaskOver && 'bg-brand-blue/5'
        )}
        style={{ minHeight: 80 }}
      >
        {tarefas.map((tarefa) => (
          <CartaoTarefa
            key={tarefa.id}
            tarefa={tarefa}
            podeMover={podeMoverTarefa(tarefa)}
            onVisualizar={onVisualizarTarefa}
          />
        ))}

        {tarefas.length === 0 && (
          <div
            className={cn(
              'h-16 border-2 border-dashed rounded-lg flex items-center justify-center',
              isTaskOver ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'
            )}
          >
            <p className="text-xs text-gray-400">
              {isTaskOver ? 'Solte aqui' : 'Sem tarefas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
