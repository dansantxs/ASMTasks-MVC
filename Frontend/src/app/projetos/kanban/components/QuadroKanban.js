'use client';

import { useState, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import ColunaKanban from './ColunaKanban';
import CartaoTarefa from './CartaoTarefa';
import DialogoMoverTarefa from './DialogoMoverTarefa';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../../../../components/ui/feedback/alert/alert-dialog';

const COLUNA_BACKLOG = { id: null, nome: 'Backlog', ordem: -1 };

// Comparadores dos cartoes dentro de uma coluna. `ordenacao` escolhe a chave principal e a
// outra vira desempate; o `id` fecha o criterio para a ordem nunca ficar instavel.
const compararPrioridade = (a, b) => (a.prioridadeOrdem ?? 0) - (b.prioridadeOrdem ?? 0);
const compararLancamento = (a, b) =>
  new Date(a.dataCadastro ?? 0).getTime() - new Date(b.dataCadastro ?? 0).getTime();

function criarComparador(ordenacao, direcao) {
  const sinal = direcao === 'desc' ? -1 : 1;
  const principal = ordenacao === 'lancamento' ? compararLancamento : compararPrioridade;
  const secundario = ordenacao === 'lancamento' ? compararPrioridade : compararLancamento;
  return (a, b) => sinal * (principal(a, b) || secundario(a, b) || a.id - b.id);
}

export default function QuadroKanban({ tarefas, etapas, colaboradores, colaboradorLogadoId, onMoverTarefa, isMovendo, ehAdmin, onReordenarColunas, onVisualizarTarefa, exibicaoNomeCliente = 'razaoSocial', ordenacao = 'prioridade', direcao = 'asc' }) {
  const [tarefaArrastando, setTarefaArrastando] = useState(null);
  const [pendente, setPendente] = useState(null);
  const [pendenteBacklog, setPendenteBacklog] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const etapasOrdenadas = useMemo(
    () =>
      [...etapas.filter((e) => e.ativo)].sort((a, b) => {
        if (a.ehEtapaFinal !== b.ehEtapaFinal) return a.ehEtapaFinal ? 1 : -1;
        return a.ordem - b.ordem;
      }),
    [etapas]
  );

  const colunas = useMemo(() => [COLUNA_BACKLOG, ...etapasOrdenadas], [etapasOrdenadas]);

  // Agrupa e ordena as tarefas por etapa uma unica vez por mudanca de `tarefas` ou da ordenacao,
  // em vez de refazer filter+sort para cada coluna a cada render. Cada bucket
  // mantem a mesma referencia entre renders, permitindo que ColunaKanban (memo)
  // pule re-renderizacoes desnecessarias durante o arraste.
  const tarefasPorEtapaMap = useMemo(() => {
    const comparador = criarComparador(ordenacao, direcao);
    const mapa = new Map();
    for (const tarefa of tarefas) {
      const chave = tarefa.etapaId ?? null;
      const bucket = mapa.get(chave);
      if (bucket) bucket.push(tarefa);
      else mapa.set(chave, [tarefa]);
    }
    for (const bucket of mapa.values()) {
      bucket.sort(comparador);
    }
    return mapa;
  }, [tarefas, ordenacao, direcao]);

  const EMPTY = useMemo(() => [], []);
  const tarefasPorEtapa = (etapaId) => tarefasPorEtapaMap.get(etapaId ?? null) ?? EMPTY;

  // Detecção de colisão customizada: tarefas só caem em zonas de tarefa, colunas só caem em zonas de coluna
  const collisionDetection = useCallback((args) => {
    const activeType = args.active.data.current?.type;
    const filtered = args.droppableContainers.filter((container) => {
      const t = container.data.current?.type;
      if (activeType === 'coluna') return t === 'coluna';
      return t === 'tarefa';
    });
    return closestCenter({ ...args, droppableContainers: filtered });
  }, []);

  const handleDragStart = ({ active }) => {
    const tipo = active.data.current?.type;
    if (tipo === 'tarefa') {
      setTarefaArrastando(active.data.current?.tarefa ?? null);
    }
  };

  const handleDragEnd = ({ active, over }) => {
    const activeType = active.data.current?.type;

    if (activeType === 'coluna') {
      if (over && over.data.current?.type === 'coluna') {
        const fromEtapaId = active.data.current?.etapaId;
        const toEtapaId = over.data.current?.etapaId;
        if (fromEtapaId !== toEtapaId) {
          onReordenarColunas?.(fromEtapaId, toEtapaId);
        }
      }
      return;
    }

    // Drag de tarefa
    setTarefaArrastando(null);

    if (!over) return;

    const tarefa = active.data.current?.tarefa;
    if (!tarefa) return;

    const etapaIdDestino = over.data.current?.etapaId ?? null;
    const etapaAtualId = tarefa.etapaId ?? null;

    if (etapaIdDestino === etapaAtualId) return;

    // Mover para o backlog: apenas admins podem, pede confirmação antes de limpar responsável
    if (etapaIdDestino === null) {
      if (ehAdmin) setPendenteBacklog(tarefa);
      return;
    }

    setPendente({ tarefa, etapaIdDestino });
  };

  const handleConfirmarMover = (colaboradorResponsavelId) => {
    if (!pendente) return;
    onMoverTarefa(pendente.tarefa, pendente.etapaIdDestino, colaboradorResponsavelId);
    setPendente(null);
  };

  const etapaDestino = pendente
    ? colunas.find((c) => (c.id ?? null) === (pendente.etapaIdDestino ?? null)) ?? null
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {colunas.map((coluna) => (
            <ColunaKanban
              key={coluna.id ?? 'backlog'}
              etapaId={coluna.id}
              titulo={coluna.nome}
              tarefas={tarefasPorEtapa(coluna.id)}
              ehAdmin={ehAdmin}
              colaboradorLogadoId={colaboradorLogadoId}
              isBacklog={coluna.id === null}
              isEtapaFinal={coluna.ehEtapaFinal ?? false}
              onVisualizarTarefa={onVisualizarTarefa}
              exibicaoNomeCliente={exibicaoNomeCliente}
              mostrarLancamento={ordenacao === 'lancamento'}
            />
          ))}
        </div>

        <DragOverlay>
          {tarefaArrastando ? (
            <CartaoTarefa tarefa={tarefaArrastando} podeMover={false} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <DialogoMoverTarefa
        open={!!pendente}
        onOpenChange={(v) => { if (!v) setPendente(null); }}
        tarefa={pendente?.tarefa ?? null}
        etapaDestino={etapaDestino}
        colaboradores={colaboradores}
        onConfirmar={handleConfirmarMover}
        isMovendo={isMovendo}
      />


      <AlertDialog open={!!pendenteBacklog} onOpenChange={(v) => { if (!v) setPendenteBacklog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para o Backlog?</AlertDialogTitle>
            <AlertDialogDescription>
              A tarefa <strong>{pendenteBacklog?.titulo}</strong> será movida para o Backlog. O responsável será removido e o progresso de elaboração será resetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onMoverTarefa(pendenteBacklog, null, null);
                setPendenteBacklog(null);
              }}
            >
              Mover para Backlog
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
