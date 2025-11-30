'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Handshake } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import ClientForm from './components/ClientForm';
import ClientList from './components/ClientList';
import ClientViewDialog from './components/ClientViewDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import ViewToggle from '../../../shared/components/ViewToggle';
import {
  getClientes,
  criarCliente,
  atualizarCliente,
  inativarCliente,
  reativarCliente
} from './api/cliente';

export default function ClientesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const queryClient = useQueryClient();

  const { data: clientesApi = [], isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: getClientes,
  });

  const clients = clientesApi.map(c => ({
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

  const handleSaveClient = (clientData) => {
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
      numero: clientData.numero
    };

    if (selectedClient) atualizar.mutate({ id: selectedClient.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmDelete = () => {
    if (selectedClient) excluir.mutate(selectedClient.id);
  };

  const handleReactivateClient = (client) => reativar.mutate(client.id);

  if (loadingClientes) {
    return <div className="p-6">Carregando clientes...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
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
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button
              onClick={() => {
                setSelectedClient(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <ClientList
          clients={clients}
          onEdit={(c) => {
            setSelectedClient(c);
            setIsFormOpen(true);
          }}
          onDelete={(c) => {
            setSelectedClient(c);
            setIsDeleteDialogOpen(true);
          }}
          onView={(c) => {
            setSelectedClient(c);
            setIsViewDialogOpen(true);
          }}
          onReactivate={handleReactivateClient}
          viewMode={viewMode}
        />

        <ClientForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          client={selectedClient}
          onSave={handleSaveClient}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          client={selectedClient}
          onConfirm={handleConfirmDelete}
        />

        <ClientViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          client={selectedClient}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}