'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Briefcase } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import PositionForm from './components/PositionForm';
import PositionList from './components/PositionList';
import PositionViewDialog from './components/PositionViewDialog';
import ViewToggle from '../../../shared/components/ViewToggle';
import { getCargos, criarCargo, atualizarCargo, inativarCargo, reativarCargo } from './api/cargos';

export default function CargosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const queryClient = useQueryClient();

  const { data: cargosApi = [], isLoading } = useQuery({
    queryKey: ["cargos"],
    queryFn: getCargos,
  });

  const positions = cargosApi.map(e => {
    return {
      id: e.id,
      name: e.nome,
      description: e.descricao,
      active: e.ativo,
    };
  });

  const criar = useMutation({
    mutationFn: criarCargo,
    onSuccess: () => {
      queryClient.invalidateQueries(["cargos"]);
      setIsFormOpen(false);
      toast.success("Cargo criado com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao criar cargo."),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }) => atualizarCargo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["cargos"]);
      setIsFormOpen(false);
      toast.success("Cargo atualizado com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao atualizar cargo."),
  });

  const excluir = useMutation({
    mutationFn: inativarCargo,
    onSuccess: () => {
      queryClient.invalidateQueries(["cargos"]);
      setIsDeleteDialogOpen(false);
      toast.success("Cargo inativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao inativar cargo."),
  });

  const reativar = useMutation({
    mutationFn: reativarCargo,
    onSuccess: () => {
      queryClient.invalidateQueries(["cargos"]);
      toast.success("Cargo reativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message || "Erro ao reativar cargo."),
  });

  const handleSavePosition = (positionData) => {
    const dataAPI = {
      nome: positionData.name,
      descricao: positionData.description,
    };

    if (selectedPosition)
      atualizar.mutate({ id: selectedPosition.id, data: dataAPI });
    else
      criar.mutate(dataAPI);
  };

  const handleConfirmDelete = () => {
    if (selectedPosition) excluir.mutate(selectedPosition.id);
  };

  const handleReactivatePosition = (position) => reativar.mutate(position.id);

  if (isLoading) return <div className="p-6">Carregando cargos...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Briefcase className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Cargos</h1>
              <p className="text-muted-foreground">
                Gerencie os cargos do sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button 
              onClick={() => { setSelectedPosition(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Cargo
            </Button>
          </div>
        </div>

        <PositionList
          positions={positions}
          onEdit={(p) => { setSelectedPosition(p); setIsFormOpen(true); }}
          onDelete={(p) => { setSelectedPosition(p); setIsDeleteDialogOpen(true); }}
          onView={(p) => { setSelectedPosition(p); setIsViewDialogOpen(true); }}
          onReactivate={handleReactivatePosition}
          viewMode={viewMode}
        />

        <PositionForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          position={selectedPosition}
          onSave={handleSavePosition}
          existingPositions={positions}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          position={selectedPosition}
          onConfirm={handleConfirmDelete}
        />

        <PositionViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          position={selectedPosition}
          onReactivate={handleReactivatePosition}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
