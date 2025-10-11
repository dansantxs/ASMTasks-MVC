'use client';
import { useState } from 'react';
import { Button } from './ui/button';
import { Plus, Building2 } from 'lucide-react';
import { Toaster } from 'sonner';
import SectorForm from './components/SectorForm';
import SectorList from './components/SectorList';
import ViewToggle from './components/ViewToggle';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import SectorViewDialog from './components/SectorViewDialog';
import { toast } from 'sonner';

// Mock data para colaboradores
const mockEmployees = [
  { id: '1', name: 'Ana Silva', active: true },
  { id: '2', name: 'Carlos Santos', active: true },
  { id: '3', name: 'Maria Oliveira', active: true },
  { id: '4', name: 'João Ferreira', active: true },
  { id: '5', name: 'Lucia Costa', active: true },
  { id: '6', name: 'Pedro Almeida', active: true },
  { id: '7', name: 'Sofia Rodrigues', active: true },
  { id: '8', name: 'Rafael Lima', active: true }
];

// Mock data para setores
const initialSectors = [
  {
    id: '1',
    name: 'Recursos Humanos',
    description: 'Responsável pela gestão de pessoas, recrutamento, seleção e desenvolvimento de talentos na empresa.',
    responsible: '1',
    responsibleName: 'Ana Silva',
    active: true,
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: '2', 
    name: 'Tecnologia da Informação',
    description: 'Gerencia toda a infraestrutura tecnológica, desenvolvimento de sistemas e suporte técnico.',
    responsible: '2',
    responsibleName: 'Carlos Santos',
    active: true,
    createdAt: '2024-01-20T09:30:00Z'
  },
  {
    id: '3',
    name: 'Marketing',
    description: 'Desenvolve estratégias de marketing, campanhas publicitárias e comunicação institucional.',
    responsible: '3', 
    responsibleName: 'Maria Oliveira',
    active: true,
    createdAt: '2024-02-01T14:15:00Z'
  },
  {
    id: '4',
    name: 'Financeiro',
    description: 'Controla as finanças da empresa, orçamento, contas a pagar e receber, e análises financeiras.',
    responsible: '4',
    responsibleName: 'João Ferreira', 
    active: true,
    createdAt: '2024-02-10T10:45:00Z'
  },
  {
    id: '5',
    name: 'Vendas',
    description: 'Responsável pelas vendas diretas, relacionamento com clientes e prospecção de novos negócios.',
    responsible: '5',
    responsibleName: 'Lucia Costa',
    active: false,
    createdAt: '2024-01-05T16:20:00Z'
  }
];

// Mock data para tarefas (para simular verificação de exclusão)
const mockTasks = [
  { id: '1', sectorId: '1', status: 'em_andamento', title: 'Processo seletivo desenvolvedor' },
  { id: '2', sectorId: '1', status: 'em_andamento', title: 'Treinamento integração' },
  { id: '3', sectorId: '2', status: 'concluida', title: 'Implementar sistema backup' },
  { id: '4', sectorId: '3', status: 'em_andamento', title: 'Campanha redes sociais' },
  { id: '5', sectorId: '4', status: 'concluida', title: 'Relatório mensal' }
];

export default function SetoresPage() {
  const [sectors, setSectors] = useState(initialSectors);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const handleCreateSector = () => {
    setSelectedSector(null);
    setIsFormOpen(true);
  };

  const handleEditSector = (sector) => {
    setSelectedSector(sector);
    setIsFormOpen(true);
  };

  const handleViewSector = (sector) => {
    setSelectedSector(sector);
    setIsViewDialogOpen(true);
  };

  const handleDeleteSector = (sector) => {
    setSelectedSector(sector);
    setIsDeleteDialogOpen(true);
  };

  const handleReactivateSector = (sector) => {
    setSectors(prev => prev.map(s => 
      s.id === sector.id 
        ? { ...s, active: true }
        : s
    ));
    toast.success(`Setor "${sector.name}" reativado com sucesso!`);
  };

  const handleSaveSector = (sectorData) => {
    if (selectedSector) {
      // Editar setor existente
      setSectors(prev => prev.map(sector => 
        sector.id === selectedSector.id 
          ? { ...sector, ...sectorData }
          : sector
      ));
    } else {
      // Criar novo setor
      const newSector = {
        id: Date.now().toString(),
        ...sectorData,
        createdAt: new Date().toISOString()
      };
      setSectors(prev => [...prev, newSector]);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSector) {
      setSectors(prev => prev.map(sector => 
        sector.id === selectedSector.id 
          ? { ...sector, active: false }
          : sector
      ));
      setIsDeleteDialogOpen(false);
      setSelectedSector(null);
      toast.success('Setor excluído com sucesso!');
    }
  };

  // Verificar se o setor tem tarefas em andamento
  const checkActiveTasks = (sectorId) => {
    const activeTasks = mockTasks.filter(task => 
      task.sectorId === sectorId && task.status === 'em_andamento'
    );
    return {
      hasActiveTasks: activeTasks.length > 0,
      count: activeTasks.length
    };
  };

  const getDeleteDialogProps = () => {
    if (!selectedSector) return { hasActiveTasks: false, activeTasksCount: 0 };
    const { hasActiveTasks, count } = checkActiveTasks(selectedSector.id);
    return { hasActiveTasks, activeTasksCount: count };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Building2 className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Gerenciamento de Setores</h1>
              <p className="text-muted-foreground">
                Gerencie os setores da empresa e seus responsáveis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button 
              onClick={handleCreateSector} 
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Setor
            </Button>
          </div>
        </div>

        {/* Lista de setores */}
        <SectorList
          sectors={sectors}
          onEdit={handleEditSector}
          onDelete={handleDeleteSector}
          onView={handleViewSector}
          onReactivate={handleReactivateSector}
          viewMode={viewMode}
        />

        {/* Modais */}
        <SectorForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          sector={selectedSector}
          onSave={handleSaveSector}
          existingSectors={sectors}
          employees={mockEmployees}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          sector={selectedSector}
          onConfirm={handleConfirmDelete}
          {...getDeleteDialogProps()}
        />

        <SectorViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          sector={selectedSector}
          onReactivate={handleReactivateSector}
        />

        {/* Toast notifications */}
        <Toaster position="top-right" />
      </div>
    </div>
  );
}