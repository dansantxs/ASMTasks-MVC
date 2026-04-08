'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Button } from '../../ui/base/button';
import AlternarVisualizacao from '../../shared/components/AlternarVisualizacao';
import FormularioProjeto from './components/FormularioProjeto';
import ListaProjetos from './components/ListaProjetos';
import DialogoVisualizarProjeto from './components/DialogoVisualizarProjeto';
import DialogoDuplicarProjeto from './components/DialogoDuplicarProjeto';
import { obterSessaoArmazenada } from '../../shared/auth/session';
import {
  atualizarProjeto,
  criarProjeto,
  duplicarProjeto,
  getColaboradores,
  getClientes,
  getEtapas,
  getPrioridades,
  getProjetos,
  getSetores,
  inativarProjeto,
  reativarProjeto,
  desmarcarConclusaoProjeto,
} from './api/projetos';

export default function ProjetosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDuplicarOpen, setIsDuplicarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [duplicatingProject, setDuplicatingProject] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');
  const queryClient = useQueryClient();
  const session = obterSessaoArmazenada();
  const colaboradorLogadoNome = session?.colaboradorNome ?? '';

  const { data: projetos = [], isLoading: isLoadingProjetos } = useQuery({
    queryKey: ['projetos'],
    queryFn: getProjetos,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['projetos-clientes'],
    queryFn: getClientes,
  });

  const { data: setores = [] } = useQuery({
    queryKey: ['projetos-setores'],
    queryFn: getSetores,
  });

  const { data: prioridades = [] } = useQuery({
    queryKey: ['projetos-prioridades'],
    queryFn: getPrioridades,
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['projetos-colaboradores'],
    queryFn: getColaboradores,
  });

  const { data: etapas = [] } = useQuery({
    queryKey: ['projetos-etapas'],
    queryFn: getEtapas,
  });

  const clientesById = useMemo(() => {
    const map = new Map();
    clientes.forEach((item) => map.set(item.id, item.nome));
    return map;
  }, [clientes]);

  const setoresById = useMemo(() => {
    const map = new Map();
    setores.forEach((item) => map.set(item.id, item.nome));
    return map;
  }, [setores]);

  const prioridadesById = useMemo(() => {
    const map = new Map();
    prioridades.forEach((item) => map.set(item.id, { nome: item.nome, cor: item.cor, ordem: item.ordem ?? 9999 }));
    return map;
  }, [prioridades]);

  const colaboradoresById = useMemo(() => {
    const map = new Map();
    colaboradores.forEach((item) => map.set(item.id, item.nome));
    return map;
  }, [colaboradores]);

  const etapasById = useMemo(() => {
    const map = new Map();
    etapas.forEach((item) => map.set(item.id, item.nome));
    return map;
  }, [etapas]);

  const criar = useMutation({
    mutationFn: criarProjeto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      setIsFormOpen(false);
      toast.success('Projeto criado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao criar projeto.'),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, payload }) => atualizarProjeto(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      setIsFormOpen(false);
      setEditingProject(null);
      toast.success('Projeto atualizado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao atualizar projeto.'),
  });

  const inativar = useMutation({
    mutationFn: inativarProjeto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto inativado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao inativar projeto.'),
  });

  const reativar = useMutation({
    mutationFn: reativarProjeto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto reativado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao reativar projeto.'),
  });

  const desmarcarConclusao = useMutation({
    mutationFn: desmarcarConclusaoProjeto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      toast.success('Projeto reaberto com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao desmarcar conclusão do projeto.'),
  });

  const duplicar = useMutation({
    mutationFn: ({ id, clienteIds }) => duplicarProjeto(id, clienteIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      setIsDuplicarOpen(false);
      setDuplicatingProject(null);
      const qtd = data?.ids?.length ?? 1;
      toast.success(qtd === 1 ? 'Projeto duplicado com sucesso.' : `${qtd} projetos duplicados com sucesso.`);
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao duplicar projeto.'),
  });

  const handleOpenCreate = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setIsViewOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleAbrirDuplicar = (project) => {
    setDuplicatingProject(project);
    setIsDuplicarOpen(true);
  };

  const handleSalvarProjeto = (payload) => {
    if (editingProject?.id) {
      const body = { ...payload };
      delete body.id;
      atualizar.mutate({ id: editingProject.id, payload: body });
      return;
    }

    criar.mutate(payload);
  };

  if (isLoadingProjetos) return <div className="p-6">Carregando projetos...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <FolderKanban className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Projetos</h1>
              <p className="text-muted-foreground">
                Cadastre projetos e suas tarefas iniciais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            <Button
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
              onClick={handleOpenCreate}
            >
              <Plus className="h-4 w-4" />
              Novo Projeto
            </Button>
          </div>
        </div>

        <ListaProjetos
          projetos={projetos}
          clientesById={clientesById}
          setoresById={setoresById}
          etapasById={etapasById}
          aoSelecionarProjeto={handleSelectProject}
          modoVisualizacao={modoVisualizacao}
        />

        <DialogoVisualizarProjeto
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          projeto={selectedProject}
          clientesById={clientesById}
          setoresById={setoresById}
          prioridadesById={prioridadesById}
          colaboradoresById={colaboradoresById}
          etapasById={etapasById}
          aoEditar={handleEditProject}
          onInativar={(id) => inativar.mutate(id)}
          onReativar={(id) => reativar.mutate(id)}
          onDesmarcarConclusao={(id) => desmarcarConclusao.mutate(id)}
          onDuplicar={handleAbrirDuplicar}
          isInativando={inativar.isPending}
          isReativando={reativar.isPending}
          isDesmarCando={desmarcarConclusao.isPending}
        />

        <FormularioProjeto
          open={isFormOpen}
          onOpenChange={(nextOpen) => {
            setIsFormOpen(nextOpen);
            if (!nextOpen) setEditingProject(null);
          }}
          aoSalvar={handleSalvarProjeto}
          salvando={criar.isPending || atualizar.isPending}
          clientes={clientes}
          setores={setores}
          prioridades={prioridades}
          colaboradorLogadoNome={colaboradorLogadoNome}
          dadosIniciais={editingProject}
        />

        <DialogoDuplicarProjeto
          open={isDuplicarOpen}
          onOpenChange={(next) => {
            setIsDuplicarOpen(next);
            if (!next) setDuplicatingProject(null);
          }}
          projeto={duplicatingProject}
          clientes={clientes}
          aoConfirmar={(id, clienteIds) => duplicar.mutate({ id, clienteIds })}
          salvando={duplicar.isPending}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
