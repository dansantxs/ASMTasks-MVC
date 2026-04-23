'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Workflow } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import FormularioEtapa from './components/FormularioEtapa';
import ListaEtapas from './components/ListaEtapas';
import DialogoVisualizarEtapa from './components/DialogoVisualizarEtapa';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import TourGuia from '../../../shared/components/TourGuia';
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

  const etapas = etapasApi.map(e => ({
    id: e.id,
    name: e.nome,
    description: e.descricao,
    active: e.ativo,
    hasActiveTasks: e.possuiTarefasAtivas ?? false,
    isFinalStage: e.ehEtapaFinal ?? false,
  }));

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

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;
      const primeiraEtapa = etapas.find(e => e.active) ?? etapas[0];

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
          setIsViewDialogOpen(false);
          setEtapaSelecionada(null);
        },
        steps: [
          {
            element: '#tour-cabecalho',
            popover: {
              title: 'Gerenciamento de Etapas',
              description: 'Etapas representam o fluxo de trabalho de uma tarefa — ex.: "A Fazer", "Em Progresso", "Concluído".',
              side: 'bottom', align: 'start',
            },
          },
          {
            element: '#tour-alternar-visualizacao',
            popover: {
              title: 'Alternar Visualização',
              description: 'Alterne entre visualização em <strong>cards</strong> ou em <strong>tabela</strong>.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-busca',
            popover: {
              title: 'Buscar Etapas',
              description: 'Filtre as etapas por nome ou descrição em tempo real.',
              side: 'bottom', align: 'start',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Etapas Ativas',
              description: 'Lista de todas as etapas ativas. Etapas marcadas como <strong>final</strong> indicam conclusão da tarefa.',
              side: 'top',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Como Alterar uma Etapa',
              description: 'Para alterar uma etapa existente, clique no botão <strong>Editar</strong> (ícone de lápis) em qualquer card ou linha da tabela. O formulário abrirá com os dados já preenchidos — faça as alterações e clique em <strong>Salvar</strong>.',
              side: 'top',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Como Excluir/Inativar uma Etapa',
              description: 'Clique no botão <strong>Excluir</strong> (ícone de lixeira) para inativar a etapa. A exclusão é <strong>lógica</strong> — o registro fica inativo e pode ser reativado com o botão <strong>Reativar</strong>.<br><br>⚠️ <strong>Não é possível inativar</strong> uma etapa que possui <strong>tarefas em andamento</strong> associadas. Mova as tarefas para outra etapa antes.',
              side: 'top',
            },
          },
          {
            element: '#tour-btn-nova-etapa',
            popover: {
              title: 'Criar Nova Etapa',
              description: 'Clique para abrir o formulário. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
              side: 'bottom', align: 'end',
              onNextClick: () => {
                setEtapaSelecionada(null);
                setIsFormOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              },
            },
          },
          {
            element: '#tour-etapa-form-nome',
            popover: {
              title: 'Nome da Etapa',
              description: 'Campo <strong>obrigatório</strong> e único. Ex.: "Em Revisão", "Bloqueado".',
              side: 'bottom',
            },
          },
          {
            element: '#tour-etapa-form-descricao',
            popover: {
              title: 'Descrição',
              description: 'Campo <strong>opcional</strong>. Explique quando uma tarefa deve entrar nesta etapa.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-etapa-form-final',
            popover: {
              title: 'Etapa Final',
              description: 'Ative para indicar que esta etapa representa a <strong>conclusão</strong> da tarefa. Só pode haver uma etapa final por vez.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-etapa-form-botoes',
            popover: {
              title: 'Possíveis Erros ao Salvar',
              description: '⛔ <strong>Nome obrigatório:</strong> o campo Nome não pode estar em branco.<br>⛔ <strong>Nome já cadastrado:</strong> já existe uma etapa com este nome — use um nome diferente.<br>⛔ <strong>Etapa final já existe:</strong> só é permitida uma etapa final — desative a atual antes de marcar outra.<br>⛔ <strong>Erro de conexão:</strong> verifique sua conexão e tente novamente.',
              side: 'top',
            },
          },
          {
            element: '#tour-etapa-form-botoes',
            popover: {
              title: 'Salvar ou Cancelar',
              description: 'Clique em <strong>Cadastrar Etapa</strong> para salvar ou <strong>Cancelar</strong> para fechar sem salvar.',
              side: 'top',
              onNextClick: () => {
                setIsFormOpen(false);
                if (primeiraEtapa) {
                  setEtapaSelecionada(primeiraEtapa);
                  setIsViewDialogOpen(true);
                  setTimeout(() => tour.moveNext(), 350);
                } else {
                  tour.destroy();
                }
              },
            },
          },
          ...(primeiraEtapa ? [
            {
              element: '#tour-etapa-view-card',
              popover: {
                title: 'Informações da Etapa',
                description: 'Exibe nome, descrição e status (ativo/inativo) da etapa.',
                side: 'right',
              },
            },
            {
              element: '#tour-etapa-view-sistema',
              popover: {
                title: 'Informações do Sistema',
                description: 'ID único e status detalhado. Etapas excluídas ficam <strong>inativas</strong> (exclusão lógica), preservando o histórico.',
                side: 'top',
              },
            },
          ] : []),
        ],
      });

      tour.drive();
    });
  }, [etapas]);

  if (isLoading) return <div className="p-6">Carregando etapas...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Workflow className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Etapas</h1>
              <p className="text-muted-foreground">Gerencie as etapas do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-nova-etapa"
              onClick={() => { setEtapaSelecionada(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Nova Etapa
            </Button>
          </div>
        </div>

        <ListaEtapas
          etapas={etapas}
          aoEditar={(e) => { setEtapaSelecionada(e); setIsFormOpen(true); }}
          aoExcluir={(e) => { setEtapaSelecionada(e); setIsDeleteDialogOpen(true); }}
          aoVisualizar={(e) => { setEtapaSelecionada(e); setIsViewDialogOpen(true); }}
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
