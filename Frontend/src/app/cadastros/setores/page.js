'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Building2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import FormularioSetor from './components/FormularioSetor';
import ListaSetores from './components/ListaSetores';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import DialogoVisualizarSetor from './components/DialogoVisualizarSetor';
import { getSetores, criarSetor, atualizarSetor, inativarSetor, reativarSetor } from './api/setores';

export default function SetoresPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [setorSelecionado, setSetorSelecionado] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');

  const queryClient = useQueryClient();

  const { data: setoresApi = [], isLoading } = useQuery({
    queryKey: ["setores"],
    queryFn: getSetores,
  });

  const setores = setoresApi.map(s => ({
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

  const handleSalvarSetor = (sectorData) => {
    const dataAPI = {
      nome: sectorData.name,
      descricao: sectorData.description,
    };

    if (setorSelecionado) atualizar.mutate({ id: setorSelecionado.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (setorSelecionado) excluir.mutate(setorSelecionado.id);
  };

  const handleReativarSetor = (setor) => reativar.mutate(setor.id);

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
            <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            <Button
              onClick={() => { setSetorSelecionado(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Setor
            </Button>
          </div>
        </div>

        <ListaSetores
          setores={setores}
          aoEditar={(s) => { setSetorSelecionado(s); setIsFormOpen(true); }}
          aoExcluir={(s) => { setSetorSelecionado(s); setIsDeleteDialogOpen(true); }}
          aoVisualizar={(s) => { setSetorSelecionado(s); setIsViewDialogOpen(true); }}
          aoReativar={handleReativarSetor}
          modoVisualizacao={modoVisualizacao}
        />

        <FormularioSetor
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          setor={setorSelecionado}
          aoSalvar={handleSalvarSetor}
          setoresExistentes={setores}
        />

        <DialogoConfirmarExclusao
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          setor={setorSelecionado}
          aoConfirmar={handleConfirmarExclusao}
          possuiTarefasAtivas={setorSelecionado?.hasActiveTasks}
          possuiFuncionariosAtivos={setorSelecionado?.hasActiveEmployees}
        />

        <DialogoVisualizarSetor
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          setor={setorSelecionado}
          aoReativar={handleReativarSetor}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
