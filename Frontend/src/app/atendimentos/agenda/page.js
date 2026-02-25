'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../ui/base/button';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import AppointmentCalendar from './components/AppointmentCalendar';
import AppointmentForm from './components/AppointmentForm';
import AppointmentViewDialog from './components/AppointmentViewDialog';
import {
  atualizarAtendimento,
  criarAtendimento,
  getAtendimentos,
  getClientes,
  getColaboradores,
  inativarAtendimento,
  marcarAtendimentoComoAgendado,
  marcarAtendimentoComoRealizado,
} from './api/atendimentos';
import { getStoredSession } from '../../../shared/auth/session';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toIso(date) {
  return date.toISOString();
}

function formatPeriod(start, end) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export default function AgendaAtendimentosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [filteredColaboradoresIds, setFilteredColaboradoresIds] = useState([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const queryClient = useQueryClient();
  const session = getStoredSession();
  const colaboradorLogadoId = Number(session?.colaboradorId ?? 0);
  const colaboradorLogadoNome = session?.colaboradorNome ?? '';

  const weekEnd = useMemo(() => endOfWeek(weekStart), [weekStart]);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-atendimento'],
    queryFn: getClientes,
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores-atendimento'],
    queryFn: getColaboradores,
  });

  const { data: atendimentosApi = [], isLoading: isLoadingAtendimentos } = useQuery({
    queryKey: ['atendimentos', toIso(weekStart), toIso(weekEnd)],
    queryFn: () => getAtendimentos(toIso(weekStart), toIso(weekEnd)),
    refetchOnWindowFocus: false,
  });

  const clientesById = useMemo(() => {
    const map = new Map();
    clientes.forEach((c) => map.set(c.id, c.nome));
    return map;
  }, [clientes]);

  const colaboradoresById = useMemo(() => {
    const map = new Map();
    colaboradores.forEach((c) => map.set(c.id, c.nome));
    return map;
  }, [colaboradores]);

  const atendimentos = useMemo(() => {
    return atendimentosApi
      .filter((item) => item.ativo)
      .map((item) => ({
        id: item.id,
        titulo: item.titulo,
        descricao: item.descricao,
        clienteId: item.clienteId,
        cadastradoPorColaboradorId: item.cadastradoPorColaboradorId,
        cadastradoPorNome: colaboradoresById.get(item.cadastradoPorColaboradorId) ?? null,
        clienteNome: clientesById.get(item.clienteId) ?? null,
        dataHoraInicio: new Date(item.dataHoraInicio),
        dataHoraFim: item.dataHoraFim ? new Date(item.dataHoraFim) : null,
        status: item.status,
        ativo: item.ativo,
        colaboradoresIds: item.colaboradoresIds ?? [],
        notificacoesMinutosAntecedencia: item.notificacoesMinutosAntecedencia ?? [],
        colaboradoresNomes: (item.colaboradoresIds ?? [])
          .map((id) => colaboradoresById.get(id))
          .filter(Boolean),
      }));
  }, [atendimentosApi, clientesById, colaboradoresById]);

  const atendimentosFiltrados = useMemo(() => {
    if (filteredColaboradoresIds.length === 0) return atendimentos;

    return atendimentos.filter((atendimento) =>
      atendimento.colaboradoresIds?.some((id) => filteredColaboradoresIds.includes(id))
    );
  }, [atendimentos, filteredColaboradoresIds]);

  const toggleFiltroColaborador = (colaboradorId) => {
    setFilteredColaboradoresIds((prev) =>
      prev.includes(colaboradorId)
        ? prev.filter((id) => id !== colaboradorId)
        : [...prev, colaboradorId]
    );
  };

  useEffect(() => {
    if (colaboradorLogadoId > 0 && filteredColaboradoresIds.length === 0) {
      setFilteredColaboradoresIds([colaboradorLogadoId]);
    }
  }, [colaboradorLogadoId, filteredColaboradoresIds.length]);

  const criar = useMutation({
    mutationFn: criarAtendimento,
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setIsFormOpen(false);
      toast.success('Atendimento agendado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao agendar atendimento.'),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, payload }) => atualizarAtendimento(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setIsFormOpen(false);
      setSelectedAppointment(null);
      toast.success('Atendimento alterado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao alterar atendimento.'),
  });

  const concluir = useMutation({
    mutationFn: marcarAtendimentoComoRealizado,
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setIsViewOpen(false);
      setSelectedAppointment(null);
      toast.success('Atendimento marcado como concluido.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao concluir atendimento.'),
  });

  const desmarcarConclusao = useMutation({
    mutationFn: marcarAtendimentoComoAgendado,
    onSuccess: (_, id) => {
      queryClient.setQueriesData({ queryKey: ['atendimentos'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((item) => (item.id === id ? { ...item, status: 'A' } : item));
      });
      setSelectedAppointment((prev) =>
        prev?.id === id ? { ...prev, status: 'A' } : prev
      );
      toast.success('Atendimento retornou para agendado.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao desmarcar atendimento concluido.'),
  });

  const excluir = useMutation({
    mutationFn: inativarAtendimento,
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setIsViewOpen(false);
      setSelectedAppointment(null);
      toast.success('Atendimento excluido com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao excluir atendimento.'),
  });

  const handleSave = (payload) => {
    if (selectedAppointment?.id) {
      atualizar.mutate({ id: selectedAppointment.id, payload });
      return;
    }

    criar.mutate(payload);
  };

  const handleOpenNew = () => {
    setSelectedAppointment(null);
    setIsFormOpen(true);
  };

  const handleOpenView = (appointment) => {
    setSelectedAppointment(appointment);
    setIsViewOpen(true);
  };

  const handleEditFromView = () => {
    if (selectedAppointment?.status === 'R') return;
    setIsViewOpen(false);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <CalendarDays className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Agenda de Atendimentos</h1>
              <p className="text-muted-foreground">Visualize e agende atendimentos por data e hora</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              const prev = new Date(weekStart);
              prev.setDate(prev.getDate() - 7);
              setWeekStart(startOfWeek(prev));
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {formatPeriod(weekStart, weekEnd)}
            </span>
            <Button variant="outline" onClick={() => {
              const next = new Date(weekStart);
              next.setDate(next.getDate() + 7);
              setWeekStart(startOfWeek(next));
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setWeekStart(startOfWeek(new Date()))} variant="outline">
              Hoje
            </Button>
            <Button
              onClick={handleOpenNew}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Atendimento
            </Button>
          </div>
        </div>

        {isLoadingAtendimentos ? (
          <div className="p-6">Carregando agenda...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                >
                  {isFilterPanelOpen ? 'Ocultar filtro de colaboradores' : 'Mostrar filtro de colaboradores'}
                </Button>
                {filteredColaboradoresIds.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFilteredColaboradoresIds([])}
                  >
                    Limpar filtro
                  </Button>
                )}
              </div>

              {isFilterPanelOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {colaboradores
                    .filter((colaborador) => colaborador.ativo)
                    .map((colaborador) => (
                      <label
                        key={colaborador.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filteredColaboradoresIds.includes(colaborador.id)}
                          onChange={() => toggleFiltroColaborador(colaborador.id)}
                        />
                        <span>{colaborador.nome}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>

            <AppointmentCalendar
              days={weekDays}
              appointments={atendimentosFiltrados}
              onSelectAppointment={handleOpenView}
            />
          </div>
        )}

        <AppointmentForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          clientes={clientes}
          colaboradores={colaboradores}
          appointment={selectedAppointment}
          colaboradorLogadoNome={colaboradorLogadoNome}
          onSave={handleSave}
          isSaving={criar.isPending || atualizar.isPending}
        />

        <AppointmentViewDialog
          open={isViewOpen}
          onOpenChange={setIsViewOpen}
          appointment={selectedAppointment}
          onEdit={handleEditFromView}
          onToggleConclude={() =>
            selectedAppointment?.id &&
            (selectedAppointment.status === 'R'
              ? desmarcarConclusao.mutate(selectedAppointment.id)
              : concluir.mutate(selectedAppointment.id))
          }
          onDelete={() =>
            selectedAppointment?.id &&
            selectedAppointment?.status !== 'R' &&
            excluir.mutate(selectedAppointment.id)
          }
          isTogglingConclude={concluir.isPending || desmarcarConclusao.isPending}
          isDeleting={excluir.isPending}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
