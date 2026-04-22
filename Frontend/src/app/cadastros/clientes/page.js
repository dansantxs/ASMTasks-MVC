'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Handshake } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import FormularioCliente from './components/FormularioCliente';
import ListaClientes from './components/ListaClientes';
import DialogoVisualizarCliente from './components/DialogoVisualizarCliente';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import TourGuia from '../../../shared/components/TourGuia';
import { getClientes, criarCliente, atualizarCliente, inativarCliente, reativarCliente } from './api/cliente';

export default function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');

  const queryClient = useQueryClient();

  const { data: clientesApi = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: getClientes,
  });

  const clientes = clientesApi.map(c => ({
    id: c.id.toString(),
    name: c.nome,
    documento: c.documento,
    tipoPessoa: c.tipoPessoa,
    rg: c.rg,
    inscricaoEstadual: c.inscricaoEstadual,
    email: c.email,
    telefone: c.telefone,
    active: c.ativo,
    cep: c.cep,
    cidade: c.cidade,
    uf: c.uf,
    logradouro: c.logradouro,
    bairro: c.bairro,
    numero: c.numero,
    site: c.site,
    dataReferencia: c.dataReferencia,
    hasActiveTasks: c.possuiTarefasAtivas ?? false,
  }));

  const criar = useMutation({
    mutationFn: criarCliente,
    onSuccess: () => {
      queryClient.invalidateQueries(["clientes"]);
      setIsFormOpen(false);
      toast.success("Cliente criado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao criar cliente."),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }) => atualizarCliente(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["clientes"]);
      setIsFormOpen(false);
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao atualizar cliente."),
  });

  const excluir = useMutation({
    mutationFn: inativarCliente,
    onSuccess: () => {
      queryClient.invalidateQueries(["clientes"]);
      setIsDeleteDialogOpen(false);
      toast.success("Cliente inativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao inativar cliente."),
  });

  const reativar = useMutation({
    mutationFn: reativarCliente,
    onSuccess: () => {
      queryClient.invalidateQueries(["clientes"]);
      toast.success("Cliente reativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao reativar cliente."),
  });

  const handleSalvarCliente = (clientData) => {
    const dataAPI = {
      nome: clientData.nome,
      documento: clientData.documento,
      tipoPessoa: clientData.tipoPessoa,
      rg: clientData.rg,
      inscricaoEstadual: clientData.inscricaoEstadual,
      email: clientData.email,
      telefone: clientData.telefone,
      site: clientData.site,
      dataReferencia: clientData.dataReferencia,
      cep: clientData.cep,
      cidade: clientData.cidade,
      uf: clientData.uf,
      logradouro: clientData.logradouro,
      bairro: clientData.bairro,
      numero: clientData.numero,
    };
    if (clienteSelecionado) atualizar.mutate({ id: clienteSelecionado.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (clienteSelecionado) excluir.mutate(clienteSelecionado.id);
  };

  const handleReativarCliente = (cliente) => reativar.mutate(cliente.id);

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;
      const primeiroCliente = clientes.find(c => c.active) ?? clientes[0];

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
          setClienteSelecionado(null);
        },
        steps: [
          {
            element: '#tour-cabecalho',
            popover: {
              title: 'Gerenciamento de Clientes',
              description: 'Cadastre e gerencie os clientes vinculados aos projetos. O sistema suporta <strong>Pessoa Física</strong> (CPF) e <strong>Pessoa Jurídica</strong> (CNPJ).',
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
              title: 'Buscar Clientes',
              description: 'Filtre os clientes por nome ou CPF/CNPJ em tempo real.',
              side: 'bottom', align: 'start',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Clientes Ativos',
              description: 'Lista de todos os clientes ativos. Cada card exibe nome, documento, contato e botões de ação.',
              side: 'top',
            },
          },
          {
            element: '#tour-btn-novo-cliente',
            popover: {
              title: 'Cadastrar Novo Cliente',
              description: 'Clique para abrir o formulário. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
              side: 'bottom', align: 'end',
              onNextClick: () => {
                setClienteSelecionado(null);
                setIsFormOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              },
            },
          },
          {
            element: '#tour-cli-form-identificacao',
            popover: {
              title: 'Identificação',
              description: 'Informe <strong>Nome/Razão Social</strong>, <strong>Tipo de Pessoa</strong> (Física ou Jurídica), <strong>CPF/CNPJ</strong> e <strong>data de nascimento/inauguração</strong>. Campos obrigatórios marcados com *.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-cli-form-contato',
            popover: {
              title: 'Contato',
              description: 'Informe <strong>e-mail</strong>, <strong>telefone</strong> e (para Pessoa Jurídica) o <strong>site</strong> do cliente.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-cli-form-endereco',
            popover: {
              title: 'Endereço',
              description: 'Digite o <strong>CEP</strong> para preencher automaticamente logradouro, bairro e cidade via ViaCEP. Ajuste os dados se necessário.',
              side: 'top',
            },
          },
          {
            element: '#tour-cli-form-botoes',
            popover: {
              title: 'Salvar ou Cancelar',
              description: 'Clique em <strong>Cadastrar Cliente</strong> para salvar ou <strong>Cancelar</strong> para fechar sem salvar.',
              side: 'top',
              onNextClick: () => {
                setIsFormOpen(false);
                if (primeiroCliente) {
                  setClienteSelecionado(primeiroCliente);
                  setIsViewDialogOpen(true);
                  setTimeout(() => tour.moveNext(), 350);
                } else {
                  tour.destroy();
                }
              },
            },
          },
          ...(primeiroCliente ? [
            {
              element: '#tour-cli-view-card',
              popover: {
                title: 'Dados do Cliente',
                description: 'Exibe todos os dados cadastrados: documentos, contato e endereço completo.',
                side: 'right',
              },
            },
            {
              element: '#tour-cli-view-sistema',
              popover: {
                title: 'Informações do Sistema',
                description: 'ID único e status. Clientes excluídos ficam <strong>inativos</strong> (exclusão lógica), preservando o histórico de projetos.',
                side: 'top',
              },
            },
          ] : []),
        ],
      });

      tour.drive();
    });
  }, [clientes]);

  if (loadingClientes) return <div className="p-6">Carregando clientes...</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Handshake className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Clientes</h1>
              <p className="text-muted-foreground">
                Cadastre, atualize e gerencie os clientes do sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-novo-cliente"
              onClick={() => { setClienteSelecionado(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <ListaClientes
          clientes={clientes}
          aoEditar={(c) => { setClienteSelecionado(c); setIsFormOpen(true); }}
          aoExcluir={(c) => { setClienteSelecionado(c); setIsDeleteDialogOpen(true); }}
          aoVisualizar={(c) => { setClienteSelecionado(c); setIsViewDialogOpen(true); }}
          aoReativar={handleReativarCliente}
          modoVisualizacao={modoVisualizacao}
        />

        <FormularioCliente
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          cliente={clienteSelecionado}
          aoSalvar={handleSalvarCliente}
        />

        <DialogoConfirmarExclusao
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          cliente={clienteSelecionado}
          aoConfirmar={handleConfirmarExclusao}
          possuiTarefasAtivas={clienteSelecionado?.hasActiveTasks}
        />

        <DialogoVisualizarCliente
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          cliente={clienteSelecionado}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
