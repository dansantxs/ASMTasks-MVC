'use client';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '../../../ui/base/button';
import { Plus, Users } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import FormularioColaborador from './components/FormularioColaborador';
import ListaColaboradores from './components/ListaColaboradores';
import DialogoVisualizarColaborador from './components/DialogoVisualizarColaborador';
import { DialogoConfirmarExclusao } from './components/DialogoConfirmarExclusao';
import AlternarVisualizacao from '../../../shared/components/AlternarVisualizacao';
import TourGuia from '../../../shared/components/TourGuia';
import { getColaboradores, criarColaborador, atualizarColaborador, inativarColaborador, reativarColaborador } from './api/colaboradores';
import { getSetores } from '../setores/api/setores';
import { getCargos } from '../cargos/api/cargos';

export default function ColaboradoresPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState(null);
  const [modoVisualizacao, setModoVisualizacao] = useState('cards');

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

  const colaboradores = colaboradoresApi.map(c => {
    const setor = setoresApi.find(s => s.id === c.setorId);
    const cargo = cargosApi.find(ca => ca.id === c.cargoId);
    return {
      id: c.id.toString(),
      name: c.nome,
      cpf: c.cpf,
      email: c.email,
      telefone: c.telefone,
      active: c.ativo,
      hasActiveTasks: c.possuiTarefasAtivas ?? false,
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

  const setores = setoresApi.map(s => ({ id: s.id, name: s.nome }));
  const cargos = cargosApi.map(c => ({ id: c.id, name: c.nome }));

  const criar = useMutation({
    mutationFn: criarColaborador,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["colaboradores"]);
      setIsFormOpen(false);
      const loginGerado = data?.loginGerado;
      toast.success(loginGerado
        ? `Colaborador criado com sucesso! Usuário: ${loginGerado}`
        : "Colaborador criado com sucesso!"
      );
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

  const handleSalvarColaborador = (employeeData) => {
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
    if (colaboradorSelecionado) atualizar.mutate({ id: colaboradorSelecionado.id, data: dataAPI });
    else criar.mutate(dataAPI);
  };

  const handleConfirmarExclusao = () => {
    if (colaboradorSelecionado) excluir.mutate(colaboradorSelecionado.id);
  };

  const handleReativarColaborador = (colaborador) => reativar.mutate(colaborador.id);

  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      let tour;
      const primeiroColaborador = colaboradores.find(c => c.active) ?? colaboradores[0];

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
          setColaboradorSelecionado(null);
        },
        steps: [
          {
            element: '#tour-cabecalho',
            popover: {
              title: 'Gerenciamento de Colaboradores',
              description: 'Cadastre os colaboradores da empresa. Cada colaborador é vinculado a um <strong>setor</strong> e um <strong>cargo</strong>, e recebe acesso ao sistema automaticamente.',
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
              title: 'Buscar Colaboradores',
              description: 'Filtre por nome, CPF, cargo ou setor em tempo real.',
              side: 'bottom', align: 'start',
            },
          },
          {
            element: '#tour-lista-ativos',
            popover: {
              title: 'Colaboradores Ativos',
              description: 'Lista de todos os colaboradores ativos com nome, cargo, setor e botões de ação.',
              side: 'top',
            },
          },
          {
            element: '#tour-btn-novo-colaborador',
            popover: {
              title: 'Cadastrar Novo Colaborador',
              description: 'Clique para abrir o formulário. Clique em <strong>Próximo</strong> para ver o formulário em ação.',
              side: 'bottom', align: 'end',
              onNextClick: () => {
                setColaboradorSelecionado(null);
                setIsFormOpen(true);
                setTimeout(() => tour.moveNext(), 350);
              },
            },
          },
          {
            element: '#tour-colab-form-pessoal',
            popover: {
              title: 'Informações Pessoais',
              description: 'Informe o <strong>nome completo</strong> (nome e sobrenome) e o <strong>CPF</strong> válido do colaborador.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-colab-form-contato',
            popover: {
              title: 'Contato',
              description: '<strong>E-mail</strong> é obrigatório pois será usado como login. O <strong>telefone</strong> é opcional.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-colab-form-endereco',
            popover: {
              title: 'Endereço',
              description: 'Digite o <strong>CEP</strong> para preencher automaticamente logradouro, bairro e cidade via ViaCEP.',
              side: 'bottom',
            },
          },
          {
            element: '#tour-colab-form-datas',
            popover: {
              title: 'Datas',
              description: '<strong>Data de nascimento</strong> é obrigatória (colaborador deve ter 18+ anos). A <strong>data de admissão</strong> é preenchida automaticamente com hoje.',
              side: 'top',
            },
          },
          {
            element: '#tour-colab-form-vinculos',
            popover: {
              title: 'Vínculos Organizacionais',
              description: 'Selecione o <strong>setor</strong> e o <strong>cargo</strong> do colaborador. Ambos são obrigatórios. Cadastre-os primeiro nas telas de Setores e Cargos.',
              side: 'top',
            },
          },
          {
            element: '#tour-colab-form-botoes',
            popover: {
              title: 'Salvar ou Cancelar',
              description: 'Clique em <strong>Cadastrar Colaborador</strong> para salvar. Um login será gerado automaticamente com base no e-mail.',
              side: 'top',
              onNextClick: () => {
                setIsFormOpen(false);
                if (primeiroColaborador) {
                  setColaboradorSelecionado(primeiroColaborador);
                  setIsViewDialogOpen(true);
                  setTimeout(() => tour.moveNext(), 350);
                } else {
                  tour.destroy();
                }
              },
            },
          },
          ...(primeiroColaborador ? [
            {
              element: '#tour-colab-view-pessoal',
              popover: {
                title: 'Informações Pessoais',
                description: 'CPF, datas de nascimento e admissão, e dados de contato do colaborador.',
                side: 'right',
              },
            },
            {
              element: '#tour-colab-view-vinculos',
              popover: {
                title: 'Vínculos Organizacionais',
                description: 'Setor e cargo em que o colaborador está alocado.',
                side: 'right',
              },
            },
            {
              element: '#tour-colab-view-sistema',
              popover: {
                title: 'Informações do Sistema',
                description: 'ID único e status. Colaboradores excluídos ficam <strong>inativos</strong> (exclusão lógica), preservando o histórico de tarefas.',
                side: 'top',
              },
            },
          ] : []),
        ],
      });

      tour.drive();
    });
  }, [colaboradores]);

  if (loadingColaboradores || loadingSetores || loadingCargos) {
    return <div className="p-6">Carregando colaboradores...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div id="tour-cabecalho" className="flex items-center gap-3">
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
            <TourGuia aoIniciar={iniciarTour} />
            <div id="tour-alternar-visualizacao">
              <AlternarVisualizacao modoVisualizacao={modoVisualizacao} aoAlterarModoVisualizacao={setModoVisualizacao} />
            </div>
            <Button
              id="tour-btn-novo-colaborador"
              onClick={() => { setColaboradorSelecionado(null); setIsFormOpen(true); }}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          </div>
        </div>

        <ListaColaboradores
          colaboradores={colaboradores}
          aoEditar={(e) => { setColaboradorSelecionado(e); setIsFormOpen(true); }}
          aoExcluir={(e) => { setColaboradorSelecionado(e); setIsDeleteDialogOpen(true); }}
          aoVisualizar={(e) => { setColaboradorSelecionado(e); setIsViewDialogOpen(true); }}
          aoReativar={handleReativarColaborador}
          modoVisualizacao={modoVisualizacao}
        />

        <FormularioColaborador
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          colaborador={colaboradorSelecionado}
          aoSalvar={handleSalvarColaborador}
          setores={setores}
          cargos={cargos}
        />

        <DialogoConfirmarExclusao
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          colaborador={colaboradorSelecionado}
          aoConfirmar={handleConfirmarExclusao}
          possuiTarefasAtivas={colaboradorSelecionado?.hasActiveTasks}
        />

        <DialogoVisualizarColaborador
          open={isViewDialogOpen}
          onOpenChange={setIsViewDialogOpen}
          colaborador={colaboradorSelecionado}
          aoReativar={handleReativarColaborador}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
