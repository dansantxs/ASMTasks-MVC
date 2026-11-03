'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { motivoParaNaoMover } from '../utils/regrasMover';
import ColunaKanban from './ColunaKanban';
import CartaoTarefa from './CartaoTarefa';
import DialogoMoverTarefa from './DialogoMoverTarefa';
import { nomeClienteDaTarefa } from '../../../../utils/nomeCliente';
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

// Coluna das tarefas ainda sem etapa. Não é uma etapa cadastrada: é onde a tarefa nasce,
// antes de alguém pegá-la.
const COLUNA_ATENDIMENTO = { id: null, nome: 'Atendimento', ordem: -1 };

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

export default function QuadroKanban({ tarefas, etapas, colaboradores, colaboradorLogadoId, onMoverTarefa, onMoverVarias, isMovendo, ehAdmin, onReordenarColunas, onVisualizarTarefa, exibicaoNomeCliente = 'razaoSocial', ordenacao = 'prioridade', direcao = 'asc', chaveFiltros = '' }) {
  const [tarefaArrastando, setTarefaArrastando] = useState(null);
  // Tarefas que vão juntas no arrasto: a seleção, quando a tarefa arrastada faz parte dela.
  const [pacoteArrastando, setPacoteArrastando] = useState([]);
  const [pendente, setPendente] = useState(null); // { tarefas, bloqueadas, etapaIdDestino }
  const [pendenteAtendimento, setPendenteAtendimento] = useState(null); // tarefas

  // Seleção para mover várias de uma vez (Ctrl+clique ou caixinha no cartão).
  const [selecionadas, setSelecionadas] = useState(() => new Set());
  const alternarSelecao = useCallback((tarefaId) => {
    setSelecionadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(tarefaId)) nova.delete(tarefaId);
      else nova.add(tarefaId);
      return nova;
    });
  }, []);
  const limparSelecao = useCallback(() => setSelecionadas((atual) => (atual.size ? new Set() : atual)), []);

  // Esc limpa a seleção, e trocar os filtros também.
  useEffect(() => {
    const aoTeclar = (e) => { if (e.key === 'Escape') limparSelecao(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [limparSelecao]);
  useEffect(() => { limparSelecao(); }, [chaveFiltros, limparSelecao]);

  // O quadro se atualiza sozinho a cada 30 s: tarefa que saiu da tela sai da seleção, mas as
  // outras continuam marcadas.
  useEffect(() => {
    setSelecionadas((atual) => {
      if (!atual.size) return atual;
      const visiveis = new Set(tarefas.map((t) => t.id));
      const filtrada = new Set([...atual].filter((id) => visiveis.has(id)));
      return filtrada.size === atual.size ? atual : filtrada;
    });
  }, [tarefas]);

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

  const colunas = useMemo(() => [COLUNA_ATENDIMENTO, ...etapasOrdenadas], [etapasOrdenadas]);

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
      const tarefa = active.data.current?.tarefa ?? null;
      setTarefaArrastando(tarefa);
      // Arrastou uma marcada: vai a seleção inteira. Arrastou uma não marcada: só ela, e a
      // seleção fica como estava.
      setPacoteArrastando(
        tarefa && selecionadas.has(tarefa.id) && selecionadas.size > 1
          ? tarefas.filter((t) => selecionadas.has(t.id))
          : tarefa ? [tarefa] : []
      );
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
    const pacote = pacoteArrastando;
    setTarefaArrastando(null);
    setPacoteArrastando([]);

    if (!over || pacote.length === 0) return;

    const etapaIdDestino = over.data.current?.etapaId ?? null;
    // As que já estão na coluna de destino ficam de fora.
    const aMover = pacote.filter((t) => (t.etapaId ?? null) !== etapaIdDestino);
    if (aMover.length === 0) return;

    // Voltar para Atendimento: apenas admins podem (ETP-15), pede confirmação antes de limpar responsável
    if (etapaIdDestino === null) {
      if (ehAdmin) setPendenteAtendimento(aMover);
      return;
    }

    // Quem a pessoa não pode mover aparece riscado no diálogo, com o motivo, e não é enviado.
    const contexto = { ehAdmin, colaboradorLogadoId, etapaDestinoId: etapaIdDestino };
    const liberadas = [];
    const bloqueadas = [];
    aMover.forEach((tarefa) => {
      const motivo = motivoParaNaoMover(tarefa, contexto);
      if (motivo) bloqueadas.push({ tarefa, motivo });
      else liberadas.push(tarefa);
    });
    if (liberadas.length === 0) {
      toast.error(`Nenhuma das tarefas pode ser movida por você: ${bloqueadas[0].motivo}.`);
      return;
    }

    setPendente({ tarefas: liberadas, bloqueadas, etapaIdDestino });
  };

  const handleConfirmarMover = (lista) => {
    if (!pendente) return;
    if (lista.length === 1 && pendente.bloqueadas.length === 0) {
      onMoverTarefa(lista[0].tarefa, pendente.etapaIdDestino, lista[0].colaboradorResponsavelId);
    } else {
      onMoverVarias(lista, pendente.etapaIdDestino);
      limparSelecao();
    }
    setPendente(null);
  };

  const etapaDestino = pendente
    ? colunas.find((c) => (c.id ?? null) === (pendente.etapaIdDestino ?? null)) ?? null
    : null;

  return (
    <>
      {selecionadas.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-brand-blue/30 bg-brand-blue/5 px-3 py-2 text-sm text-brand-blue">
          <span className="font-medium">
            {selecionadas.size === 1 ? '1 tarefa selecionada' : `${selecionadas.size} tarefas selecionadas`}
          </span>
          <span className="text-xs text-gray-500">Arraste uma delas para mover todas juntas.</span>
          <button
            type="button"
            onClick={limparSelecao}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium hover:underline"
            title="Limpar seleção (Esc)"
          >
            <X className="h-3.5 w-3.5" /> Limpar seleção
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {colunas.map((coluna) => (
            <ColunaKanban
              key={coluna.id ?? 'atendimento'}
              etapaId={coluna.id}
              titulo={coluna.nome}
              tarefas={tarefasPorEtapa(coluna.id)}
              ehAdmin={ehAdmin}
              colaboradorLogadoId={colaboradorLogadoId}
              isAtendimento={coluna.id === null}
              isEtapaFinal={coluna.ehEtapaFinal ?? false}
              onVisualizarTarefa={onVisualizarTarefa}
              exibicaoNomeCliente={exibicaoNomeCliente}
              mostrarLancamento={ordenacao === 'lancamento'}
              selecionadas={selecionadas}
              onAlternarSelecao={alternarSelecao}
            />
          ))}
        </div>

        <DragOverlay>
          {tarefaArrastando ? (
            <div className="relative">
              <CartaoTarefa
                tarefa={tarefaArrastando}
                podeMover={false}
                nomeCliente={nomeClienteDaTarefa(tarefaArrastando, exibicaoNomeCliente)}
              />
              {pacoteArrastando.length > 1 && (
                <span className="absolute -top-2 -right-2 rounded-full bg-brand-blue px-2 py-0.5 text-xs font-semibold text-white shadow">
                  +{pacoteArrastando.length - 1}
                </span>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <DialogoMoverTarefa
        open={!!pendente}
        onOpenChange={(v) => { if (!v) setPendente(null); }}
        tarefas={pendente?.tarefas ?? []}
        bloqueadas={pendente?.bloqueadas ?? []}
        etapaDestino={etapaDestino}
        colaboradores={colaboradores}
        onConfirmar={handleConfirmarMover}
        isMovendo={isMovendo}
      />


      <AlertDialog open={!!pendenteAtendimento} onOpenChange={(v) => { if (!v) setPendenteAtendimento(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para Atendimento?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendenteAtendimento?.length > 1 ? (
                <>
                  As <strong>{pendenteAtendimento.length} tarefas</strong> selecionadas serão movidas para Atendimento.
                </>
              ) : (
                <>
                  A tarefa <strong>{pendenteAtendimento?.[0]?.titulo}</strong> será movida para Atendimento.
                </>
              )}{' '}
              O responsável será removido e o progresso de elaboração será resetado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendenteAtendimento.length === 1) {
                  onMoverTarefa(pendenteAtendimento[0], null, null);
                } else {
                  onMoverVarias(pendenteAtendimento.map((tarefa) => ({ tarefa, colaboradorResponsavelId: null })), null);
                  limparSelecao();
                }
                setPendenteAtendimento(null);
              }}
            >
              Mover para Atendimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
