'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Flag } from 'lucide-react';
import { Toaster } from 'sonner';
import PriorityForm from './components/PriorityForm';
import PriorityList from './components/PriorityList';
import ViewToggle from '../../../shared/components/ViewToggle';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import PriorityViewDialog from './components/PriorityViewDialog';
import { toast } from 'sonner';
import { getPrioridades, criarPrioridade, atualizarPrioridade, inativarPrioridade, reativarPrioridade } from './api/prioridades';

export default function PrioridadesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const queryClient = useQueryClient();

  const { data: prioridadesApi = [], isLoading } = useQuery({
    queryKey: ["prioridades"],
    queryFn: getPrioridades,
  });

  const priorities = prioridadesApi.map(p => {
    const color = p.cor ?? "#000000";
    return {
      id: p.id,
      name: p.nome,
      description: p.descricao,
      color: color,
      active: p.ativo,
    };
  });

  const criar = useMutation({
    mutationFn: criarPrioridade,
    onSuccess: () => {
      queryClient.invalidateQueries(["prioridades"]);
      setIsFormOpen(false);
      toast.success("Prioridade criada com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao criar prioridade."),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }) => atualizarPrioridade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["prioridades"]);
      setIsFormOpen(false);
      toast.success("Prioridade atualizada com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao atualizar prioridade."),
  });

  const excluir = useMutation({
    mutationFn: inativarPrioridade,
    onSuccess: () => {
      queryClient.invalidateQueries(["prioridades"]);
      setIsDeleteDialogOpen(false);
      toast.success("Prioridade inativada com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao inativar prioridade."),
  });

  const reativar = useMutation({
    mutationFn: reativarPrioridade,
    onSuccess: () => {
      queryClient.invalidateQueries(["prioridades"]);
      toast.success("Prioridade reativada com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao reativar prioridade."),
  });

  const handleSavePriority = (priorityData) => {
    const dataAPI = {
      nome: priorityData.name,
      descricao: priorityData.description,
      cor: priorityData.color,
    };

    if (selectedPriority)
      atualizar.mutate({ id: selectedPriority.id, data: dataAPI });
    else
      criar.mutate(dataAPI);
  };

  const handleConfirmDelete = () => {
    if (selectedPriority) excluir.mutate(selectedPriority.id);
  };

  const handleReactivatePriority = (priority) => reativar.mutate(priority.id);

  if (isLoading) return <div className="p-6">Carregando prioridades...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Flag className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Prioridades</h1>
              <p className="text-muted-foreground">
                Gerencie as prioridades do sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button
              onClick={() => { setSelectedPriority(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Nova Prioridade
            </Button>
          </div>
        </div>

        <PriorityList
          priorities={priorities}
          onEdit={(p) => { setSelectedPriority(p); setIsFormOpen(true); }}
          onDelete={(p) => { setSelectedPriority(p); setIsDeleteDialogOpen(true); }}
          onView={(p) => { setSelectedPriority(p); setIsViewDialogOpen(true); }}
          onReactivate={handleReactivatePriority}
          viewMode={viewMode}
        />

        <PriorityForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          priority={selectedPriority}
          onSave={handleSavePriority}
          existingPriorities={priorities}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          priority={selectedPriority}
          onConfirm={handleConfirmDelete}
        />

        <PriorityViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          priority={selectedPriority}
          onReactivate={handleReactivatePriority}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}