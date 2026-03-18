'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Briefcase } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import FormularioCargo from './components/FormularioCargo';
import ListaCargos from './components/ListaCargos';
import DialogoVisualizarCargo from './components/DialogoVisualizarCargo';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import { getCargos, criarCargo, atualizarCargo, inativarCargo, reativarCargo } from './api/cargos';

export default function CargosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [cargoSelecionado, setCargoSelecionado] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');

  const queryClient = useQueryClient();

  const { data: cargosApi = [], isLoading } = useQuery({
    queryKey: ["cargos"],
    queryFn: getCargos,
  });

  const cargos = cargosApi.map(e => {
    return {
      id: e.id,
      name: e.nome,
      description: e.descricao,
      active: e.ativo,
      hasActiveCollaborators: e.possuiColaboradoresAtivos ?? false,
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

  const handleSalvarCargo = (positionData) => {
    const dataAPI = {
      nome: positionData.name,
      descricao: positionData.description,
    };

    if (cargoSelecionado)
      atualizar.mutate({ id: cargoSelecionado.id, data: dataAPI });
    else
      criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (cargoSelecionado) excluir.mutate(cargoSelecionado.id);
  };

  const handleReativarCargo = (cargo) => reativar.mutate(cargo.id);

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
            <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            <Button
              onClick={() => { setCargoSelecionado(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Cargo
            </Button>
          </div>
        </div>

        <ListaCargos
          cargos={cargos}
          aoEditar={(p) => { setCargoSelecionado(p); setIsFormOpen(true); }}
          aoExcluir={(p) => { setCargoSelecionado(p); setIsDeleteDialogOpen(true); }}
          aoVisualizar={(p) => { setCargoSelecionado(p); setIsViewDialogOpen(true); }}
          aoReativar={handleReativarCargo}
          modoVisualizacao={modoVisualizacao}
        />

        <FormularioCargo
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          cargo={cargoSelecionado}
          aoSalvar={handleSalvarCargo}
          cargosExistentes={cargos}
        />

        <DialogoConfirmarExclusao
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          cargo={cargoSelecionado}
          aoConfirmar={handleConfirmarExclusao}
          possuiColaboradoresAtivos={cargoSelecionado?.hasActiveCollaborators}
        />

        <DialogoVisualizarCargo
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          cargo={cargoSelecionado}
          aoReativar={handleReativarCargo}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
