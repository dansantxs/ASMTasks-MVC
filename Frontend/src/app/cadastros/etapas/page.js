'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Workflow } from 'lucide-react';
import { Toaster } from 'sonner';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import FormularioEtapa from './components/FormularioEtapa';
import ListaEtapas from './components/ListaEtapas';
import DialogoVisualizarEtapa from './components/DialogoVisualizarEtapa';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import { toast } from 'sonner';
import { getEtapas, criarEtapa, atualizarEtapa, inativarEtapa, reativarEtapa } from './api/etapas';

export default function EtapasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [etapaSelecionada, setEtapaSelecionada] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');

  const queryClient = useQueryClient();

  const { data: etapasApi = [], isLoading } = useQuery({
    queryKey: ["etapas"],
    queryFn: getEtapas,
  });

  const etapas = etapasApi.map(e => {
    return {
      id: e.id,
      name: e.nome,
      description: e.descricao,
      active: e.ativo,
      hasActiveTasks: e.possuiTarefasAtivas ?? false,
      isFinalStage: e.ehEtapaFinal ?? false,
    };
  });

  const criar = useMutation({
    mutationFn: criarEtapa,
    onSuccess: () => {
      queryClient.invalidateQueries(["etapas"]);
      setIsFormOpen(false);
      toast.success("Etapa criada com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao criar etapa."),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }) => atualizarEtapa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["etapas"]);
      setIsFormOpen(false);
      toast.success("Etapa atualizada com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao atualizar etapa."),
  });

  const excluir = useMutation({
    mutationFn: inativarEtapa,
    onSuccess: () => {
      queryClient.invalidateQueries(["etapas"]);
      setIsDeleteDialogOpen(false);
      toast.success("Etapa inativada com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao inativar etapa."),
  });

  const reativar = useMutation({
    mutationFn: reativarEtapa,
    onSuccess: () => {
      queryClient.invalidateQueries(["etapas"]);
      toast.success("Etapa reativada com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao reativar etapa."),
  });

  const handleSalvarEtapa = (stageData) => {
    const dataAPI = {
      nome: stageData.name,
      descricao: stageData.description,
      ehEtapaFinal: stageData.isFinalStage ?? false,
    };

    if (etapaSelecionada) atualizar.mutate({ id: etapaSelecionada.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (etapaSelecionada) excluir.mutate(etapaSelecionada.id);
  };

  const handleReativarEtapa = (etapa) => reativar.mutate(etapa.id);

  if (isLoading) return <div className="p-6">Carregando etapas...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Workflow className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Etapas</h1>
              <p className="text-muted-foreground">Gerencie as etapas do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            <Button
              onClick={() => {
                setEtapaSelecionada(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Nova Etapa
            </Button>
          </div>
        </div>

        <ListaEtapas
          etapas={etapas}
          aoEditar={(e) => {
            setEtapaSelecionada(e);
            setIsFormOpen(true);
          }}
          aoExcluir={(e) => {
            setEtapaSelecionada(e);
            setIsDeleteDialogOpen(true);
          }}
          aoVisualizar={(e) => {
            setEtapaSelecionada(e);
            setIsViewDialogOpen(true);
          }}
          aoReativar={handleReativarEtapa}
          modoVisualizacao={modoVisualizacao}
        />

        <FormularioEtapa
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          etapa={etapaSelecionada}
          aoSalvar={handleSalvarEtapa}
          etapasExistentes={etapas}
        />

        <DialogoConfirmarExclusao
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          etapa={etapaSelecionada}
          aoConfirmar={handleConfirmarExclusao}
          possuiTarefasAtivas={etapaSelecionada?.hasActiveTasks}
        />

        <DialogoVisualizarEtapa
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          etapa={etapaSelecionada}
          aoReativar={handleReativarEtapa}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
