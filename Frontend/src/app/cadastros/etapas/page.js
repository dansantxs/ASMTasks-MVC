'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Workflow } from 'lucide-react';
import { Toaster } from 'sonner';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import StageForm from './components/StageForm';
import StageList from './components/StageList';
import StageViewDialog from './components/StageViewDialog';
import ViewToggle from '../../../shared/components/ViewToggle';
import { toast } from 'sonner';
import { getEtapas, criarEtapa, atualizarEtapa, inativarEtapa, reativarEtapa } from './api/etapas';

export default function EtapasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const queryClient = useQueryClient();

  const { data: etapasApi = [], isLoading } = useQuery({
    queryKey: ["etapas"],
    queryFn: getEtapas,
  });

  const stages = etapasApi.map(e => {
    return {
      id: e.id,
      name: e.nome,
      description: e.descricao,
      active: e.ativo,
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

  const handleSaveStage = (stageData) => {
    const dataAPI = {
      nome: stageData.name,
      descricao: stageData.description,
    };

    if (selectedStage) atualizar.mutate({ id: selectedStage.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmDelete = () => {
    if (selectedStage) excluir.mutate(selectedStage.id);
  };

  const handleReactivateStage = (stage) => reativar.mutate(stage.id);

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
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button
              onClick={() => {
                setSelectedStage(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Nova Etapa
            </Button>
          </div>
        </div>

        <StageList
          stages={stages}
          onEdit={(e) => {
            setSelectedStage(e);
            setIsFormOpen(true);
          }}
          onDelete={(e) => {
            setSelectedStage(e);
            setIsDeleteDialogOpen(true);
          }}
          onView={(e) => {
            setSelectedStage(e);
            setIsViewDialogOpen(true);
          }}
          onReactivate={handleReactivateStage}
          viewMode={viewMode}
        />

        <StageForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          stage={selectedStage}
          onSave={handleSaveStage}
          existingStages={stages}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          stage={selectedStage}
          onConfirm={handleConfirmDelete}
        />

        <StageViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          stage={selectedStage}
          onReactivate={handleReactivateStage}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
