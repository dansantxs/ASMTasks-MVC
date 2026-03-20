'use client';

import { useState, useCallback } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import ColunaKanban from './ColunaKanban';
import CartaoTarefa from './CartaoTarefa';
import DialogoMoverTarefa from './DialogoMoverTarefa';
import DialogoVisualizarTarefa from './DialogoVisualizarTarefa';

const COLUNA_BACKLOG = { id: null, nome: 'Backlog', ordem: -1 };

export default function QuadroKanban({ tarefas, etapas, colaboradores, podeMover, onMoverTarefa, isMovendo, ehAdmin, onReordenarColunas }) {
  const [tarefaArrastando, setTarefaArrastando] = useState(null);
  const [pendente, setPendente] = useState(null);
  const [tarefaVisualizando, setTarefaVisualizando] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const etapasOrdenadas = [...etapas.filter((e) => e.ativo)].sort((a, b) => a.ordem - b.ordem);

  const colunas = [
    ...(ehAdmin ? [COLUNA_BACKLOG] : []),
    ...etapasOrdenadas,
  ];

  const tarefasPorEtapa = (etapaId) =>
    tarefas
      .filter((t) => (t.etapaId ?? null) === (etapaId ?? null))
      .sort((a, b) => (a.prioridadeOrdem ?? 0) - (b.prioridadeOrdem ?? 0));

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

    // Mover para o backlog: sem diálogo, limpa responsável automaticamente
    if (etapaIdDestino === null) {
      onMoverTarefa(tarefa, null, null);
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
              podeMover={podeMover}
              ehAdmin={ehAdmin}
              isBacklog={coluna.id === null}
              onVisualizarTarefa={setTarefaVisualizando}
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

      <DialogoVisualizarTarefa
        open={!!tarefaVisualizando}
        onOpenChange={(v) => { if (!v) setTarefaVisualizando(null); }}
        tarefa={tarefaVisualizando}
      />
    </>
  );
}
