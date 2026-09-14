'use client';

import { memo, useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../../components/ui/form/utils';
import { ROTULO_RESERVADO, ehEtapaElaboracao, ehReservado } from '../../../../utils/situacaoTarefa';
import CartaoTarefa from './CartaoTarefa';

function resolverNomeCliente(tarefa, exibicao) {
  if (exibicao === 'nomeFantasia' && tarefa.clienteNomeFantasia) return tarefa.clienteNomeFantasia;
  return tarefa.clienteNome;
}

function ColunaKanban({ etapaId, titulo, tarefas, ehAdmin, colaboradorLogadoId, isAtendimento, isEtapaFinal, onVisualizarTarefa, exibicaoNomeCliente = 'razaoSocial', mostrarLancamento = false }) {
  const podeMoverTarefa = (tarefa) => {
    if (isAtendimento && !ehAdmin) return false;
    return (
      ehAdmin ||
      tarefa.colaboradorResponsavelId == null ||
      tarefa.colaboradorResponsavelId === colaboradorLogadoId
    );
  };
  const podeReordenar = ehAdmin && !isAtendimento && !isEtapaFinal;

  // Na etapa de elaboração, o que alguém vai fazer (Reservado) fica separado do que já começou.
  // A ordem de cada faixa é a mesma da coluna, que já chega ordenada.
  const faixas = useMemo(() => {
    if (isAtendimento || !ehEtapaElaboracao(titulo)) return null;
    return [
      { chave: 'reservado', titulo: ROTULO_RESERVADO, tarefas: tarefas.filter((t) => ehReservado(titulo, t.statusAtual)) },
      { chave: 'em-elaboracao', titulo: 'Em elaboração', tarefas: tarefas.filter((t) => !ehReservado(titulo, t.statusAtual)) },
    ];
  }, [isAtendimento, titulo, tarefas]);

  const renderizarCartao = (tarefa) => (
    <CartaoTarefa
      key={tarefa.id}
      tarefa={tarefa}
      podeMover={podeMoverTarefa(tarefa)}
      onVisualizar={onVisualizarTarefa}
      nomeCliente={resolverNomeCliente(tarefa, exibicaoNomeCliente)}
      mostrarLancamento={mostrarLancamento}
    />
  );

  const {
    attributes: dragAttrs,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging: isColumnDragging,
  } = useDraggable({
    id: `coluna-${etapaId ?? 'atendimento'}`,
    data: { type: 'coluna', etapaId },
    disabled: !podeReordenar,
  });

  const { setNodeRef: setColDropRef, isOver: isColOver } = useDroppable({
    id: `col-drop-${etapaId ?? 'atendimento'}`,
    data: { type: 'coluna', etapaId },
  });

  const { setNodeRef: setTaskDropRef, isOver: isTaskOver } = useDroppable({
    id: `etapa-${etapaId ?? 'sem-etapa'}`,
    data: { type: 'tarefa', etapaId },
    disabled: isAtendimento && !ehAdmin,
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
          isTaskOver && (!isAtendimento || ehAdmin) && 'bg-brand-blue/5'
        )}
        style={{ minHeight: 80 }}
      >
        {faixas && tarefas.length > 0
          ? faixas.map((faixa) => (
              <div key={faixa.chave} className="space-y-2">
                <div className="flex items-center justify-between px-0.5 pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{faixa.titulo}</p>
                  <span className="text-[11px] font-medium text-gray-400">{faixa.tarefas.length}</span>
                </div>
                {faixa.tarefas.map(renderizarCartao)}
              </div>
            ))
          : tarefas.map(renderizarCartao)}

        {tarefas.length === 0 && (
          <div
            className={cn(
              'h-16 border-2 border-dashed rounded-lg flex items-center justify-center',
              isTaskOver && (!isAtendimento || ehAdmin) ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-200'
            )}
          >
            <p className="text-xs text-gray-400">
              {isTaskOver && (!isAtendimento || ehAdmin) ? 'Solte aqui' : 'Sem tarefas'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// memo: com o Map de tarefas por etapa memoizado no QuadroKanban, cada coluna so
// re-renderiza quando as suas proprias tarefas mudam (nao a cada arraste global).
export default memo(ColunaKanban);
