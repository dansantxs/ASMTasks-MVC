'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { obterSessaoArmazenada } from '../../../shared/auth/session';
import { temPermissao, permissoesTelas } from '../../../shared/auth/permissions';
import {
  getTarefasKanban,
  moverTarefaEtapa,
  reordenarEtapas,
  getEtapasKanban,
  getColaboradoresKanban,
  getProjetosKanban,
  getClientesKanban,
} from './api/kanban';
import FiltrosKanban from './components/FiltrosKanban';
import QuadroKanban from './components/QuadroKanban';

export default function KanbanPage() {
  const session = obterSessaoArmazenada();
  const colaboradorLogadoId = session?.colaboradorId ?? null;
  const ehAdmin = temPermissao({ permissoes: session?.permissoes ?? [] }, permissoesTelas.projetosCadastro);

  const [filtros, setFiltros] = useState({
    colaboradorIds: colaboradorLogadoId ? [colaboradorLogadoId] : [],
    projetoIds: [],
    clienteIds: [],
  });

  const queryClient = useQueryClient();

  const { data: etapas = [] } = useQuery({
    queryKey: ['kanban-etapas'],
    queryFn: getEtapasKanban,
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['kanban-colaboradores'],
    queryFn: getColaboradoresKanban,
  });

  const { data: projetosRaw = [] } = useQuery({
    queryKey: ['kanban-projetos'],
    queryFn: getProjetosKanban,
  });

  const { data: clientesRaw = [] } = useQuery({
    queryKey: ['kanban-clientes'],
    queryFn: getClientesKanban,
  });

  const { data: tarefas = [], isLoading } = useQuery({
    queryKey: ['kanban-tarefas', filtros],
    queryFn: () => getTarefasKanban(filtros),
  });

  // Apenas projetos ativos — normaliza titulo → nome para o filtro
  const projetosAtivos = useMemo(
    () => projetosRaw.filter((p) => p.ativo !== false).map((p) => ({ ...p, nome: p.titulo })),
    [projetosRaw]
  );

  // Apenas clientes de projetos ativos
  const clientesFiltrados = useMemo(() => {
    const clienteIdsComProjeto = new Set(projetosAtivos.map((p) => p.clienteId));
    return clientesRaw.filter((c) => c.ativo !== false && clienteIdsComProjeto.has(c.id));
  }, [clientesRaw, projetosAtivos]);

  const colaboradoresAtivos = useMemo(() => colaboradores.filter((c) => c.ativo !== false), [colaboradores]);

  const mover = useMutation({
    mutationFn: ({ tarefaId, etapaId, colaboradorResponsavelId }) =>
      moverTarefaEtapa(tarefaId, etapaId, colaboradorResponsavelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-tarefas'] });
      toast.success('Tarefa movida com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao mover tarefa.'),
  });

  const reordenar = useMutation({
    mutationFn: (itens) => reordenarEtapas(itens),
    onError: (error) => {
      toast.error(error?.message ?? 'Erro ao reordenar colunas.');
      queryClient.invalidateQueries({ queryKey: ['kanban-etapas'] });
    },
  });

  const handleMoverTarefa = (tarefa, etapaIdDestino, colaboradorResponsavelId) => {
    mover.mutate({
      tarefaId: tarefa.id,
      etapaId: etapaIdDestino,
      colaboradorResponsavelId,
    });
  };

  const handleReordenarColunas = (fromEtapaId, toEtapaId) => {
    const etapasAtivas = [...etapas.filter((e) => e.ativo)].sort((a, b) => a.ordem - b.ordem);
    const fromIdx = etapasAtivas.findIndex((e) => e.id === fromEtapaId);
    const toIdx = etapasAtivas.findIndex((e) => e.id === toEtapaId);

    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;

    const reordenadas = [...etapasAtivas];
    const [moved] = reordenadas.splice(fromIdx, 1);
    reordenadas.splice(toIdx, 0, moved);

    const comNovaOrdem = reordenadas.map((e, i) => ({ ...e, ordem: i + 1 }));

    // Atualiza cache otimisticamente
    queryClient.setQueryData(['kanban-etapas'], (old) => {
      if (!old) return old;
      const mapa = new Map(comNovaOrdem.map((e) => [e.id, e]));
      return old.map((e) => mapa.has(e.id) ? mapa.get(e.id) : e);
    });

    reordenar.mutate(comNovaOrdem.map((e) => ({ id: e.id, ordem: e.ordem })));
  };

  const podeMoverQualquer = ehAdmin;

  return (
    <div className="min-h-screen bg-background">
      <div className="py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-blue/10 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <h1>Quadro Kanban</h1>
            <p className="text-muted-foreground">
              Acompanhe o andamento das tarefas por etapa de desenvolvimento
            </p>
          </div>
        </div>

        <div className="mb-4">
          <FiltrosKanban
            filtros={filtros}
            aoAlterarFiltros={setFiltros}
            colaboradorLogadoId={colaboradorLogadoId}
            colaboradores={colaboradoresAtivos}
            projetos={projetosAtivos}
            clientes={clientesFiltrados}
            ehAdmin={ehAdmin}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            Carregando tarefas...
          </div>
        ) : (
          <QuadroKanban
            tarefas={tarefas}
            etapas={etapas}
            colaboradores={colaboradoresAtivos}
            podeMover={podeMoverQualquer}
            onMoverTarefa={handleMoverTarefa}
            isMovendo={mover.isPending}
            ehAdmin={ehAdmin}
            onReordenarColunas={handleReordenarColunas}
          />
        )}
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
