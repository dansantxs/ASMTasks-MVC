'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Building2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import FormularioSetor from './components/FormularioSetor';
import ListaSetores from './components/ListaSetores';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import DialogoVisualizarSetor from './components/DialogoVisualizarSetor';
import TourGuia from '../../../shared/components/TourGuia';
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
    const dataAPI = { nome: sectorData.name, descricao: sectorData.description };
    if (setorSelecionado) atualizar.mutate({ id: setorSelecionado.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (setorSelecionado) excluir.mutate(setorSelecionado.id);
  };

  const handleReativarSetor = (setor) => reativar.mutate(setor.id);

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;
      const primeiroSetor = setores.find(s => s.active) ?? setores[0];

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
          setSetorSelecionado(null);
        },
        steps: [
          {
            element: '#tour-cabecalho',
            popover: {
              title: 'Gerenciamento de Setores',
              description: 'Setores organizam os colaboradores e tarefas por área ou departamento da empresa.',
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
              title: 'Buscar Setores',
              description: 'Filtre os setores por nome ou descrição em tempo real.',
              side: 'bottom', align: 'start',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Setores Ativos',
              description: 'Lista de todos os setores ativos. Cada card exibe nome, descrição e botões de ação.',
              side: 'top',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Como Alterar um Setor',
              description: 'Para alterar, clique no botão <strong>Editar</strong> (ícone de lápis) em qualquer card ou linha. Clique em <strong>Próximo</strong> para ver o formulário pré-preenchido em ação.',
              side: 'top',
              onNextClick: () => {
                if (primeiroSetor) {
                  setSetorSelecionado(primeiroSetor);
                  setIsFormOpen(true);
                  setTimeout(() => tour.moveNext(), 350);
                } else {
                  tour.moveNext();
                }
              },
            },
          },
          ...(primeiroSetor ? [{
            element: '#tour-setor-form-nome',
            popover: {
              title: 'Formulário de Alteração',
              description: 'O formulário abre com os dados do setor já preenchidos. Faça as alterações necessárias e clique em <strong>Salvar Alterações</strong> para confirmar.',
              side: 'bottom',
              onNextClick: () => {
                setIsFormOpen(false);
                setSetorSelecionado(null);
                setTimeout(() => tour.moveNext(), 200);
              },
            },
          }] : []),
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Como Excluir/Inativar um Setor',
              description: 'Clique no botão <strong>Excluir</strong> (ícone de lixeira) para inativar o setor. A exclusão é <strong>lógica</strong> — o registro fica inativo e pode ser reativado com o botão <strong>Reativar</strong>.<br><br>⚠️ <strong>Não é possível inativar</strong> um setor que possua <strong>colaboradores ativos</strong> ou <strong>tarefas em andamento</strong>. Resolva os vínculos antes de inativar.',
              side: 'top',
            },
          },
          {
            element: '#tour-btn-novo-setor',
            popover: {
              title: 'Criar Novo Setor',
              description: 'Clique para abrir o formulário. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
              side: 'bottom', align: 'end',
              onNextClick: () => {
                setSetorSelecionado(null);
                setIsFormOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              },
            },
          },
          {
            element: '#tour-setor-form-nome',
            popover: {
              title: 'Nome do Setor',
              description: 'Campo <strong>obrigatório</strong>. Informe um nome único (ex.: "Desenvolvimento", "Financeiro").',
              side: 'bottom',
            },
          },
          {
            element: '#tour-setor-form-descricao',
            popover: {
              title: 'Descrição',
              description: 'Campo <strong>opcional</strong>. Descreva as responsabilidades ou o propósito do setor.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-setor-form-botoes',
            popover: {
              title: 'Possíveis Erros ao Salvar',
              description: '⛔ <strong>Nome obrigatório:</strong> o campo Nome não pode estar em branco.<br>⛔ <strong>Nome já cadastrado:</strong> já existe um setor com este nome — use um nome diferente.<br>⛔ <strong>Erro de conexão:</strong> verifique sua conexão e tente novamente.',
              side: 'top',
            },
          },
          {
            element: '#tour-setor-form-botoes',
            popover: {
              title: 'Salvar ou Cancelar',
              description: 'Clique em <strong>Cadastrar Setor</strong> para salvar ou <strong>Cancelar</strong> para fechar sem salvar.',
              side: 'top',
              onNextClick: () => {
                setIsFormOpen(false);
                if (primeiroSetor) {
                  setSetorSelecionado(primeiroSetor);
                  setIsViewDialogOpen(true);
                  setTimeout(() => tour.moveNext(), 350);
                } else {
                  tour.destroy();
                }
              },
            },
          },
          ...(primeiroSetor ? [
            {
              element: '#tour-setor-view-card',
              popover: {
                title: 'Informações do Setor',
                description: 'Exibe nome, descrição e status (ativo/inativo) do setor selecionado.',
                side: 'right',
              },
            },
            {
              element: '#tour-setor-view-sistema',
              popover: {
                title: 'Informações do Sistema',
                description: 'ID único e status detalhado. Setores excluídos ficam <strong>inativos</strong> (exclusão lógica), preservando o histórico.',
                side: 'top',
              },
            },
          ] : []),
        ],
      });

      tour.drive();
    });
  }, [setores]);

  if (isLoading) return <div className="p-6">Carregando setores...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Building2 className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Setores</h1>
              <p className="text-muted-foreground">Gerencie os setores da empresa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-novo-setor"
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
