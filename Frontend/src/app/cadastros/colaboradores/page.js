'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import EmployeeForm from './components/EmployeeForm';
import EmployeeList from './components/EmployeeList';
import EmployeeViewDialog from './components/EmployeeViewDialog';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import ViewToggle from '../../../shared/components/ViewToggle';
import { getColaboradores, criarColaborador, atualizarColaborador, inativarColaborador, reativarColaborador } from './api/colaboradores';
import { getSetores } from '../setores/api/setores';
import { getCargos } from '../cargos/api/cargos';

export default function ColaboradoresPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const queryClient = useQueryClient();

  const { data: colaboradoresApi = [], isLoading: loadingColaboradores } = useQuery({
    queryKey: ["colaboradores"],
    queryFn: getColaboradores,
  });

  const { data: setoresApi = [], isLoading: loadingSetores } = useQuery({
    queryKey: ["setores"],
    queryFn: getSetores,
  });

  const { data: cargosApi = [], isLoading: loadingCargos } = useQuery({
    queryKey: ["cargos"],
    queryFn: getCargos,
  });

  const employees = colaboradoresApi.map(c => {
    const setor = setoresApi.find(s => s.id === c.setorId);
    const cargo = cargosApi.find(ca => ca.id === c.cargoId);

    return {
      id: c.id.toString(),
      name: c.nome,
      cpf: c.cpf,
      email: c.email,
      telefone: c.telefone,
      active: c.ativo,
      isResponsibleForSector: c.responsavelPorSetor,
      setorId: c.setorId,
      cargoId: c.cargoId,
      dataNascimento: c.dataNascimento,
      dataAdmissao: c.dataAdmissao,
      cep: c.cep,
      cidade: c.cidade,
      uf: c.uf,
      logradouro: c.logradouro,
      bairro: c.bairro,
      numero: c.numero,
      setorNome: setor ? setor.nome : '—',
      cargoNome: cargo ? cargo.nome : '—',
    };
  });

  const setores = setoresApi.map(s => ({
    id: s.id,
    name: s.nome,
  }));

  const cargos = cargosApi.map(c => ({
    id: c.id,
    name: c.nome,
  }));

  const criar = useMutation({
    mutationFn: criarColaborador,
    onSuccess: () => {
      queryClient.invalidateQueries(["colaboradores"]);
      setIsFormOpen(false);
      toast.success("Colaborador criado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao criar colaborador."),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, data }) => atualizarColaborador(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["colaboradores"]);
      setIsFormOpen(false);
      toast.success("Colaborador atualizado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao atualizar colaborador."),
  });

  const excluir = useMutation({
    mutationFn: inativarColaborador,
    onSuccess: () => {
      queryClient.invalidateQueries(["colaboradores"]);
      setIsDeleteDialogOpen(false);
      toast.success("Colaborador inativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao inativar colaborador."),
  });

  const reativar = useMutation({
    mutationFn: reativarColaborador,
    onSuccess: () => {
      queryClient.invalidateQueries(["colaboradores"]);
      toast.success("Colaborador reativado com sucesso!");
    },
    onError: (error) => toast.error(error?.message ?? "Erro ao reativar colaborador."),
  });

  const handleSaveEmployee = (employeeData) => {
    const dataAPI = {
      nome: employeeData.name,
      cpf: employeeData.cpf,
      email: employeeData.email,
      telefone: employeeData.telefone,
      cep: employeeData.cep,
      cidade: employeeData.cidade,
      uf: employeeData.uf,
      logradouro: employeeData.logradouro,
      bairro: employeeData.bairro,
      numero: parseInt(employeeData.numero) || null,
      dataNascimento: employeeData.dataNascimento,
      dataAdmissao: employeeData.dataAdmissao,
      setorId: parseInt(employeeData.setorId) || null,
      cargoId: parseInt(employeeData.cargoId) || null,
    };

    if (selectedEmployee) atualizar.mutate({ id: selectedEmployee.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmDelete = () => {
    if (selectedEmployee) excluir.mutate(selectedEmployee.id);
  };

  const handleReactivateEmployee = (employee) => reativar.mutate(employee.id);

  if (loadingColaboradores || loadingSetores || loadingCargos) {
    return <div className="p-6">Carregando colaboradores...</div>;
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
              <h1>Gerenciamento de Colaboradores</h1>
              <p className="text-muted-foreground">
                Cadastre, atualize e gerencie os colaboradores da empresa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            <Button
              onClick={() => {
                setSelectedEmployee(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </div>
        </div>

        <EmployeeList
          employees={employees}
          onEdit={(e) => {
            setSelectedEmployee(e);
            setIsFormOpen(true);
          }}
          onDelete={(e) => {
            setSelectedEmployee(e);
            setIsDeleteDialogOpen(true);
          }}
          onView={(e) => {
            setSelectedEmployee(e);
            setIsViewDialogOpen(true);
          }}
          onReactivate={handleReactivateEmployee}
          viewMode={viewMode}
        />

        <EmployeeForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          employee={selectedEmployee}
          onSave={handleSaveEmployee}
          setores={setores}
          cargos={cargos}
        />

        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          employee={selectedEmployee}
          onConfirm={handleConfirmDelete}
          isResponsibleForSector={selectedEmployee?.isResponsibleForSector}
        />

        <EmployeeViewDialog
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          employee={selectedEmployee}
          onReactivate={handleReactivateEmployee}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}