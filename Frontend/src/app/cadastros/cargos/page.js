'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Briefcase } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import FormularioCargo from './components/FormularioCargo';
import ListaCargos from './components/ListaCargos';
import DialogoVisualizarCargo from './components/DialogoVisualizarCargo';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import TourGuia from '../../../shared/components/TourGuia';
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

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;

      const primeiroCargo = cargos.find(c => c.active) ?? cargos[0];

      const passosPagina = [
        {
          element: '#tour-cabecalho',
          popover: {
            title: 'Gerenciamento de Cargos',
            description: 'Esta tela permite cadastrar e gerenciar todos os cargos do sistema. Cargos classificam e organizam os colaboradores por função.',
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
            title: 'Buscar Cargos',
            description: 'Digite aqui para filtrar os cargos pelo nome ou descrição. A busca é feita em tempo real conforme você digita.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '#tour-lista-cargos',
          popover: {
            title: 'Lista de Cargos Ativos',
            description: 'Aqui são exibidos todos os cargos ativos cadastrados. Cada item mostra o nome, descrição, status e botões de ação.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-lista-cargos',
          popover: {
            title: 'Como Alterar um Cargo',
            description: 'Para alterar um cargo existente, clique no botão <strong>Editar</strong> (ícone de lápis) em qualquer card ou linha da tabela. O formulário abrirá com os dados já preenchidos — faça as alterações e clique em <strong>Salvar</strong>.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-lista-cargos',
          popover: {
            title: 'Como Excluir/Inativar um Cargo',
            description: 'Clique no botão <strong>Excluir</strong> (ícone de lixeira) para inativar o cargo. A exclusão é <strong>lógica</strong>: o registro fica inativo e pode ser reativado com o botão <strong>Reativar</strong>.<br><br>⚠️ <strong>Não é possível inativar</strong> um cargo que possui colaboradores ativos vinculados. Transfira ou inative os colaboradores antes.',
            side: 'top',
            align: 'center',
          },
        },
        {
          element: '#tour-btn-novo-cargo',
          popover: {
            title: 'Criar Novo Cargo',
            description: 'Clique aqui para abrir o formulário de cadastro. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
            side: 'bottom',
            align: 'end',
            onNextClick: () => {
              setCargoSelecionado(null);
              setIsFormOpen(true);
              setTimeout(() => tour.moveNext(), 350);
            },
          },
        },
        {
          element: '#tour-form-nome',
          popover: {
            title: 'Nome do Cargo',
            description: 'Campo <strong>obrigatório</strong>. Digite um nome único para o cargo (ex.: "Desenvolvedor", "Analista de QA").',
            side: 'bottom',
          },
        },
        {
          element: '#tour-form-descricao',
          popover: {
            title: 'Descrição',
            description: 'Campo <strong>opcional</strong>. Descreva as responsabilidades e atribuições do cargo para facilitar a identificação.',
            side: 'bottom',
          },
        },
        {
          element: '#tour-form-botoes',
          popover: {
            title: 'Possíveis Erros ao Salvar',
            description: '⛔ <strong>Nome obrigatório:</strong> o campo Nome não pode estar em branco.<br>⛔ <strong>Nome já cadastrado:</strong> já existe um cargo com este nome — use um nome diferente.<br>⛔ <strong>Erro de conexão:</strong> verifique sua conexão e tente novamente.',
            side: 'top',
          },
        },
        {
          element: '#tour-form-botoes',
          popover: {
            title: 'Salvar ou Cancelar',
            description: 'Clique em <strong>Cadastrar Cargo</strong> para salvar ou em <strong>Cancelar</strong> para fechar sem salvar.',
            side: 'top',
            onNextClick: () => {
              setIsFormOpen(false);
              if (primeiroCargo) {
                setCargoSelecionado(primeiroCargo);
                setIsViewDialogOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              } else {
                tour.destroy();
              }
            },
          },
        },
        ...(primeiroCargo ? [
          {
            element: '#tour-view-cargo',
            popover: {
              title: 'Informações do Cargo',
              description: 'Exibe o nome, descrição e o status atual (ativo ou inativo) do cargo selecionado.',
              side: 'right',
            },
          },
          {
            element: '#tour-view-info',
            popover: {
              title: 'Informações do Sistema',
              description: 'Exibe o ID único do cargo e o status detalhado. Cargos excluídos ficam <strong>inativos</strong> (exclusão lógica), preservando o histórico de colaboradores.',
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
          setIsViewDialogOpen(false);
          setCargoSelecionado(null);
        },
        steps: passosPagina,
      });

      tour.drive();
    });
  }, [cargos]);

  if (isLoading) return <div className="p-6">Carregando cargos...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
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
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-novo-cargo"
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
