'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Building2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import SectorForm from './components/SectorForm';
import SectorList from './components/SectorList';
import ViewToggle from '../../../shared/components/ViewToggle';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import SectorViewDialog from './components/SectorViewDialog';
import { getSetores, criarSetor, atualizarSetor, inativarSetor, reativarSetor } from './api/setores';

export default function SetoresPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const queryClient = useQueryClient();

  const { data: setoresApi = [], isLoading } = useQuery({
    queryKey: ["setores"],
    queryFn: getSetores,
  });

  const sectors = setoresApi.map(s => ({
    id: s.id,
    name: s.nome,
    description: s.descricao,
    active: s.ativo,
    hasActiveEmployees: s.possuiFuncionariosAtivos,
    hasActiveTasks: s.possuiTarefasAtivas ?? false,
  }));

  const criar = useMutation({
    mutationFn: criarSetor,
    onSuccess: () => {
      queryClient.invalidateQueries(["setores"]);
      setIsFormOpen(false);
      toast.success("Setor criado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao criar setor."),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }) => atualizarSetor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["setores"]);
      setIsFormOpen(false);
      toast.success("Setor atualizado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao atualizar setor."),
  });

  const excluir = useMutation({
    mutationFn: inativarSetor,
    onSuccess: () => {
      queryClient.invalidateQueries(["setores"]);
      setIsDeleteDialogOpen(false);
      toast.success("Setor inativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao inativar setor."),
  });

  const reativar = useMutation({
    mutationFn: reativarSetor,
    onSuccess: () => {
      queryClient.invalidateQueries(["setores"]);
      toast.success("Setor reativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao reativar setor."),
  });

  const handleSaveSector = (sectorData) => {
    const dataAPI = {
      nome: sectorData.name,
      descricao: sectorData.description,
    };

    if (selectedSector) atualizar.mutate({ id: selectedSector.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmDelete = () => {
    if (selectedSector) excluir.mutate(selectedSector.id);
  };

  const handleReactivateSector = (sector) => reativar.mutate(sector.id);

  if (isLoading) return <div className="p-6">Carregando setores...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Building2 className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Setores</h1>
              <p className="text-muted-foreground">
                Gerencie os setores da empresa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button
              onClick={() => { setSelectedSector(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Setor
            </Button>
          </div>
        </div>

        <SectorList
          sectors={sectors}
          onEdit={(s) => { setSelectedSector(s); setIsFormOpen(true); }}
          onDelete={(s) => { setSelectedSector(s); setIsDeleteDialogOpen(true); }}
          onView={(s) => { setSelectedSector(s); setIsViewDialogOpen(true); }}
          onReactivate={handleReactivateSector}
          viewMode={viewMode}
        />

        <SectorForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          sector={selectedSector}
          onSave={handleSaveSector}
          existingSectors={sectors}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          sector={selectedSector}
          onConfirm={handleConfirmDelete}
          hasActiveTasks={selectedSector?.hasActiveTasks}
          hasActiveEmployees={selectedSector?.hasActiveEmployees}
        />

        <SectorViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          sector={selectedSector}
          onReactivate={handleReactivateSector}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
