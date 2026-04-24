'use client';

import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Button } from '../../ui/base/button';
import AlternarVisualizacao from '../../shared/components/AlternarVisualizacao';
import TourGuia from '../../shared/components/TourGuia';
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
  getProjeto,
  getProjetos,
  getSetores,
  inativarProjeto,
  reativarProjeto,
  desmarcarConclusaoProjeto,
} from './api/projetos';
import { uploadAnexoTarefa } from './kanban/api/kanban';

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
    mutationFn: async ({ payload, pendingFilesByIndex }) => {
      const result = await criarProjeto(payload);
      if (Object.keys(pendingFilesByIndex).length > 0) {
        const projeto = await getProjeto(result.id);
        for (const [indexStr, files] of Object.entries(pendingFilesByIndex)) {
          const tarefaId = projeto.tarefas[Number(indexStr)]?.id;
          if (tarefaId) {
            for (const file of files) await uploadAnexoTarefa(tarefaId, file);
          }
        }
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos'] });
      setIsFormOpen(false);
      toast.success('Projeto criado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao criar projeto.'),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, payload, pendingFilesByIndex }) => {
      await atualizarProjeto(id, payload);
      if (Object.keys(pendingFilesByIndex).length > 0) {
        const projeto = await getProjeto(id);
        const existingIds = new Set(payload.tarefas.filter((t) => t.id).map((t) => t.id));
        const novasTarefas = projeto.tarefas.filter((t) => !existingIds.has(t.id));
        let novaIdx = 0;
        for (let i = 0; i < payload.tarefas.length; i++) {
          if (!payload.tarefas[i].id) {
            const files = pendingFilesByIndex[i] ?? [];
            const tarefaId = novasTarefas[novaIdx]?.id;
            if (tarefaId) {
              for (const file of files) await uploadAnexoTarefa(tarefaId, file);
            }
            novaIdx++;
          }
        }
      }
    },
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

  const handleSalvarProjeto = (payload, pendingFilesByIndex = {}) => {
    if (editingProject?.id) {
      const body = { ...payload };
      delete body.id;
      atualizar.mutate({ id: editingProject.id, payload: body, pendingFilesByIndex });
      return;
    }

    criar.mutate({ payload, pendingFilesByIndex });
  };

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;

      const primeiroProjeto = projetos.find((p) => p.ativo && !p.concluido) ?? projetos[0];

      const passos = [
        {
          element: '#tour-cabecalho',
          popover: {
            title: 'Gerenciamento de Projetos',
            description: 'Esta tela lista todos os projetos do sistema. Você pode criar novos projetos, visualizar os existentes e acompanhar o status de cada um.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-alternar-visualizacao',
          popover: {
            title: 'Alternar Visualização',
            description: 'Alterne entre visualização em <strong>cards</strong> (grade) ou em <strong>tabela</strong>, de acordo com sua preferência.',
            side: 'bottom',
            align: 'center',
          },
        },
        {
          element: '#tour-busca',
          popover: {
            title: 'Buscar Projetos',
            description: 'Filtre projetos por título, descrição, cliente ou setor. A busca é feita em tempo real conforme você digita.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-lista-projetos',
          popover: {
            title: 'Lista de Projetos',
            description: 'Exibe os projetos da aba selecionada (Ativos, Concluídos ou Inativos). Clique em um card para ver os detalhes completos.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-lista-projetos',
          popover: {
            title: 'Como Alterar um Projeto',
            description: 'Para alterar, clique no card para abrir a visualização e depois em <strong>Editar</strong>. Clique em <strong>Próximo</strong> para ver o formulário pré-preenchido em ação.',
            side: 'top',
            align: 'center',
            onNextClick: () => {
              if (primeiroProjeto) {
                setEditingProject(primeiroProjeto);
                setIsFormOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              } else {
                tour.moveNext();
              }
            },
          },
        },
        ...(primeiroProjeto ? [{
          element: '#tour-form-projeto-titulo',
          popover: {
            title: 'Formulário de Alteração',
            description: 'O formulário abre com os dados do projeto já preenchidos — título, cliente, setor e tarefas. Faça as alterações necessárias e clique em <strong>Salvar Alterações</strong> para confirmar.',
            side: 'bottom',
            onNextClick: () => {
              setIsFormOpen(false);
              setEditingProject(null);
              setTimeout(() => tour.moveNext(), 200);
            },
          },
        }] : []),
        {
          element: '#tour-lista-projetos',
          popover: {
            title: 'Como Inativar um Projeto',
            description: 'Abra a visualização do projeto e clique no botão <strong>Inativar</strong>. A exclusão é <strong>lógica</strong>: o projeto fica inativo (aba "Inativos") e pode ser reativado. Projetos concluídos podem ser reabertos com <strong>Reabrir projeto</strong>.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-btn-novo-projeto',
          popover: {
            title: 'Criar Novo Projeto',
            description: 'Clique aqui para abrir o formulário de cadastro de projeto. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
            side: 'bottom',
            align: 'end',
            onNextClick: () => {
              setEditingProject(null);
              setIsFormOpen(true);
              setTimeout(() => tour.moveNext(), 350);
            },
          },
        },
        {
          element: '#tour-form-projeto-dados',
          popover: {
            title: 'Dados do Projeto',
            description: 'Preencha o <strong>título</strong> (obrigatório), descrição, <strong>cliente</strong> e <strong>setor</strong> do projeto. É possível cadastrar novos clientes e setores diretamente neste formulário.',
            side: 'right',
          },
        },
        {
          element: '#tour-form-projeto-titulo',
          popover: {
            title: 'Título do Projeto',
            description: 'Campo <strong>obrigatório</strong>. Informe um título claro e descritivo para o projeto (ex.: "Implantação do módulo comercial").',
            side: 'bottom',
          },
        },
        {
          element: '#tour-form-projeto-tarefas',
          popover: {
            title: 'Tarefas do Projeto',
            description: 'Adicione as tarefas iniciais do projeto. Cada tarefa precisa de um <strong>título</strong> e uma <strong>prioridade</strong>. Responsável e etapa são definidos depois no Kanban.',
            side: 'left',
          },
        },
        {
          element: '#tour-form-projeto-botoes',
          popover: {
            title: 'Possíveis Erros ao Salvar',
            description: '⛔ <strong>Título obrigatório:</strong> o campo Título não pode estar em branco.<br>⛔ <strong>Tarefa sem título:</strong> todas as tarefas adicionadas precisam ter um título preenchido.<br>⛔ <strong>Tarefa sem prioridade:</strong> selecione uma prioridade para cada tarefa.<br>⛔ <strong>Erro de conexão:</strong> verifique sua conexão e tente novamente.',
            side: 'top',
          },
        },
        {
          element: '#tour-form-projeto-botoes',
          popover: {
            title: 'Salvar ou Cancelar',
            description: 'Clique em <strong>Criar projeto</strong> para salvar ou <strong>Cancelar</strong> para fechar sem salvar.',
            side: 'top',
            onNextClick: () => {
              setIsFormOpen(false);
              if (primeiroProjeto) {
                setSelectedProject(primeiroProjeto);
                setIsViewOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              } else {
                tour.destroy();
              }
            },
          },
        },
        ...(primeiroProjeto ? [
          {
            element: '#tour-view-projeto-dados',
            popover: {
              title: 'Dados do Projeto',
              description: 'Exibe o cliente, setor, data de cadastro e responsável pelo lançamento. Também mostra a descrição quando preenchida.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-view-projeto-tarefas',
            popover: {
              title: 'Tarefas do Projeto',
              description: 'Lista todas as tarefas vinculadas ao projeto com sua prioridade e etapa atual no Kanban. Tarefas em <strong>Backlog</strong> ainda não foram iniciadas.',
              side: 'top',
            },
          },
        ] : []),
      ];

      tour = driver({
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Próximo →',
        prevBtnText: '← Anterior',
        doneBtnText: '✓ Concluir',
        overlayOpacity: 0.6,
        smoothScroll: true,
        onDestroyed: () => {
          setIsFormOpen(false);
          setIsViewOpen(false);
          setSelectedProject(null);
          setEditingProject(null);
        },
        steps: passos,
      });

      tour.drive();
    });
  }, [projetos]);

  if (isLoadingProjetos) return <div className="p-6">Carregando projetos...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
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
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-novo-projeto"
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
