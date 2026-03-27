'use client';

import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../ui/form/utils';
import CartaoTarefa from './CartaoTarefa';

export default function ColunaKanban({ etapaId, titulo, tarefas, ehAdmin, colaboradorLogadoId, isBacklog, isEtapaFinal, onVisualizarTarefa }) {
  const podeMoverTarefa = (tarefa) => {
    if (isBacklog && !ehAdmin) return false;
    return (
      ehAdmin ||
      tarefa.colaboradorResponsavelId == null ||
      tarefa.colaboradorResponsavelId === colaboradorLogadoId
    );
  };
  const podeReordenar = ehAdmin && !isBacklog && !isEtapaFinal;

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
    disabled: isBacklog && !ehAdmin,
  });

  return (
    <div
      ref={(el) => { setDragRef(el); setColDropRef(el); }}
      style={isColumnDragging ? { opacity: 0.5 } : undefined}
      className={cn(
        'flex flex-col bg-gray-50 border rounded-xl min-w-[280px] w-[280px] max-h-[calc(100vh-230px)] transition-colors',
        isEtapaFinal ? 'border-green-300 bg-green-50/40' : 'border-gray-200',
        isColOver && !isColumnDragging && 'border-brand-blue bg-brand-blue/5'
      )}
      {...(podeReordenar ? dragAttrs : {})}
    >
      <div className={cn(
        'px-4 py-3 border-b flex items-center justify-between sticky top-0 rounded-t-xl',
        isEtapaFinal ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
      )}>
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
          <h3 className={cn('text-sm font-semibold truncate', isEtapaFinal ? 'text-green-800' : 'text-gray-700')}>{titulo}</h3>
          {isEtapaFinal && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" title="Etapa final" />}
        </div>
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-medium text-gray-600 flex-shrink-0">
          {tarefas.length}
        </span>
      </div>

      <div
        ref={setTaskDropRef}
        className={cn(
          'flex-1 overflow-y-auto p-3 space-y-2 transition-colors',
          isTaskOver && (!isBacklog || ehAdmin) && 'bg-brand-blue/5'
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
              isTaskOver && (!isBacklog || ehAdmin) ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'
            )}
          >
            <p className="text-xs text-gray-400">
              {isTaskOver && (!isBacklog || ehAdmin) ? 'Solte aqui' : 'Sem tarefas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
