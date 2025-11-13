'use client';

import { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';

import { Button } from '@core/presentation/base/button';
import ViewToggle from '@core/presentation/components/display/ViewToggle';

import ClientForm from '../components/ClientForm';
import ClientList from '../components/ClientList';
import ClientViewDialog from '../components/ClientViewDialog';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useClients } from '../hooks/use-clients';

export default function ClientsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const {
    clients,
    isLoading,
    createClient,
    updateClient,
    deactivateClient,
    reactivateClient,
  } = useClients();

  const handleSaveClient = async (clientData) => {
    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, clientData);
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClient(clientData);
        toast.success('Cliente criado com sucesso!');
      }
      setIsFormOpen(false);
      setSelectedClient(null);
    } catch (error) {
      toast.error(error?.message ?? 'Erro ao salvar cliente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;
    try {
      await deactivateClient(selectedClient.id);
      toast.success('Cliente inativado com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
    } catch (error) {
      toast.error(error?.message ?? 'Erro ao inativar cliente.');
    }
  };

  const handleReactivateClient = async (client) => {
    try {
      await reactivateClient(client.id);
      toast.success('Cliente reativado com sucesso!');
    } catch (error) {
      toast.error(error?.message ?? 'Erro ao reativar cliente.');
    }
  };

  const handleOpenForm = (client = null) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleOpenViewDialog = (client) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleOpenDeleteDialog = (client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Carregando clientes...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Users className="h-6 w-6 text-brand-blue" />
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
              onClick={() => handleOpenForm(null)}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        </div>

        <ClientList
          clients={clients}
          onEdit={handleOpenForm}
          onDelete={handleOpenDeleteDialog}
          onReactivate={handleReactivateClient}
          onView={handleOpenViewDialog}
          viewMode={viewMode}
        />
      </div>

      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        onSave={handleSaveClient}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        client={selectedClient}
      />

      <ClientViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        client={selectedClient}
      />

      <Toaster richColors position="top-right" />
    </div>
  );
}
