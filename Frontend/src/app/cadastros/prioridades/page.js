'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Flag } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import FormularioPrioridade from './components/FormularioPrioridade';
import ListaPrioridades from './components/ListaPrioridades';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import DialogoVisualizarPrioridade from './components/DialogoVisualizarPrioridade';
import TourGuia from '../../../shared/components/TourGuia';
import { getPrioridades, criarPrioridade, atualizarPrioridade, inativarPrioridade, reativarPrioridade } from './api/prioridades';

export default function PrioridadesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [prioridadeSelecionada, setPrioridadeSelecionada] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');

  const queryClient = useQueryClient();

  const { data: prioridadesApi = [], isLoading } = useQuery({
    queryKey: ["prioridades"],
    queryFn: getPrioridades,
  });

  const prioridades = prioridadesApi.map(p => ({
    id: p.id,
    name: p.nome,
    description: p.descricao,
    color: p.cor ?? '#000000',
    order: p.ordem ?? 0,
    active: p.ativo,
    hasActiveTasks: p.possuiTarefasAtivas ?? false,
  }));

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

  const handleSalvarPrioridade = (priorityData) => {
    const dataAPI = {
      nome: priorityData.name,
      descricao: priorityData.description,
      cor: priorityData.color,
      ordem: priorityData.order,
    };
    if (prioridadeSelecionada) atualizar.mutate({ id: prioridadeSelecionada.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (prioridadeSelecionada) excluir.mutate(prioridadeSelecionada.id);
  };

  const handleReativarPrioridade = (prioridade) => reativar.mutate(prioridade.id);

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;
      const primeiraPrioridade = prioridades.find(p => p.active) ?? prioridades[0];

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
          setPrioridadeSelecionada(null);
        },
        steps: [
          {
            element: '#tour-cabecalho',
            popover: {
              title: 'Gerenciamento de Prioridades',
              description: 'Prioridades classificam a urgência das tarefas. Cada prioridade tem uma <strong>cor</strong> e uma <strong>ordem</strong> que define seu nível de urgência.',
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
              title: 'Buscar Prioridades',
              description: 'Filtre as prioridades por nome ou descrição em tempo real.',
              side: 'bottom', align: 'start',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Prioridades Ativas',
              description: 'Lista de prioridades ativas, ordenadas por urgência. A cor facilita a identificação visual nas tarefas.',
              side: 'top',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Como Alterar uma Prioridade',
              description: 'Para alterar uma prioridade existente, clique no botão <strong>Editar</strong> (ícone de lápis) em qualquer card ou linha da tabela. O formulário abrirá com os dados já preenchidos — faça as alterações e clique em <strong>Salvar</strong>.',
              side: 'top',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Como Excluir/Inativar uma Prioridade',
              description: 'Clique no botão <strong>Excluir</strong> (ícone de lixeira) para inativar a prioridade. A exclusão é <strong>lógica</strong> — o registro fica inativo e pode ser reativado com o botão <strong>Reativar</strong>.<br><br>⚠️ <strong>Não é possível inativar</strong> uma prioridade que possui <strong>tarefas ativas</strong> associadas. Altere a prioridade das tarefas antes.',
              side: 'top',
            },
          },
          {
            element: '#tour-btn-nova-prioridade',
            popover: {
              title: 'Criar Nova Prioridade',
              description: 'Clique para abrir o formulário. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
              side: 'bottom', align: 'end',
              onNextClick: () => {
                setPrioridadeSelecionada(null);
                setIsFormOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              },
            },
          },
          {
            element: '#tour-prior-form-nome',
            popover: {
              title: 'Nome da Prioridade',
              description: 'Campo <strong>obrigatório</strong> e único. Ex.: "Urgente", "Alta", "Normal", "Baixa".',
              side: 'bottom',
            },
          },
          {
            element: '#tour-prior-form-descricao',
            popover: {
              title: 'Descrição',
              description: 'Campo <strong>opcional</strong>. Explique quando esta prioridade deve ser aplicada.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-prior-form-cor',
            popover: {
              title: 'Cor da Prioridade',
              description: 'Campo <strong>obrigatório</strong>. Escolha uma cor que represente visualmente o nível de urgência (ex.: vermelho = urgente).',
              side: 'bottom',
            },
          },
          {
            element: '#tour-prior-form-ordem',
            popover: {
              title: 'Ordem',
              description: 'Campo <strong>obrigatório</strong>. Número que define a urgência: <strong>1 = mais urgente</strong>. Permite ordenar as prioridades de forma clara.',
              side: 'top',
            },
          },
          {
            element: '#tour-prior-form-botoes',
            popover: {
              title: 'Possíveis Erros ao Salvar',
              description: '⛔ <strong>Nome obrigatório:</strong> o campo Nome não pode estar em branco.<br>⛔ <strong>Nome já cadastrado:</strong> já existe uma prioridade com este nome — use um nome diferente.<br>⛔ <strong>Cor obrigatória:</strong> selecione uma cor para a prioridade.<br>⛔ <strong>Ordem já utilizada:</strong> já existe outra prioridade com este número de ordem — escolha um valor diferente.<br>⛔ <strong>Erro de conexão:</strong> verifique sua conexão e tente novamente.',
              side: 'top',
            },
          },
          {
            element: '#tour-prior-form-botoes',
            popover: {
              title: 'Salvar ou Cancelar',
              description: 'Clique em <strong>Cadastrar Prioridade</strong> para salvar ou <strong>Cancelar</strong> para fechar sem salvar.',
              side: 'top',
              onNextClick: () => {
                setIsFormOpen(false);
                if (primeiraPrioridade) {
                  setPrioridadeSelecionada(primeiraPrioridade);
                  setIsViewDialogOpen(true);
                  setTimeout(() => tour.moveNext(), 350);
                } else {
                  tour.destroy();
                }
              },
            },
          },
          ...(primeiraPrioridade ? [
            {
              element: '#tour-prior-view-card',
              popover: {
                title: 'Informações da Prioridade',
                description: 'Exibe nome, descrição, cor visual e status (ativo/inativo).',
                side: 'right',
              },
            },
            {
              element: '#tour-prior-view-sistema',
              popover: {
                title: 'Informações do Sistema',
                description: 'ID único e status. Prioridades excluídas ficam <strong>inativas</strong> (exclusão lógica), preservando o histórico das tarefas.',
                side: 'top',
              },
            },
          ] : []),
        ],
      });

      tour.drive();
    });
  }, [prioridades]);

  if (isLoading) return <div className="p-6">Carregando prioridades...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Flag className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Prioridades</h1>
              <p className="text-muted-foreground">Gerencie as prioridades do sistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-nova-prioridade"
              onClick={() => { setPrioridadeSelecionada(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Nova Prioridade
            </Button>
          </div>
        </div>

        <ListaPrioridades
          prioridades={prioridades}
          aoEditar={(p) => { setPrioridadeSelecionada(p); setIsFormOpen(true); }}
          aoExcluir={(p) => { setPrioridadeSelecionada(p); setIsDeleteDialogOpen(true); }}
          aoVisualizar={(p) => { setPrioridadeSelecionada(p); setIsViewDialogOpen(true); }}
          aoReativar={handleReativarPrioridade}
          modoVisualizacao={modoVisualizacao}
        />

        <FormularioPrioridade
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          prioridade={prioridadeSelecionada}
          aoSalvar={handleSalvarPrioridade}
          prioridadesExistentes={prioridades}
        />

        <DialogoConfirmarExclusao
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          prioridade={prioridadeSelecionada}
          aoConfirmar={handleConfirmarExclusao}
          possuiTarefasAtivas={prioridadeSelecionada?.hasActiveTasks}
        />

        <DialogoVisualizarPrioridade
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          prioridade={prioridadeSelecionada}
          aoReativar={handleReativarPrioridade}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
