'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../ui/base/button';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import CalendarioAtendimentos from './components/CalendarioAtendimentos';
import FormularioAtendimento from './components/FormularioAtendimento';
import DialogoVisualizarAtendimento from './components/DialogoVisualizarAtendimento';
import DialogoConcluirAtendimento from './components/DialogoConcluirAtendimento';
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
import { obterSessaoArmazenada } from '../../../shared/auth/session';
import { configuracoesPadrao, useConfiguracoesSistema } from '../../../shared/configuracoes-sistema/api';

function inicioDaSemana(data) {
  const d = new Date(data);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fimDaSemana(inicioSemana) {
  const d = new Date(inicioSemana);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function paraIso(data) {
  return data.toISOString();
}

function formatarPeriodo(inicio, fim) {
  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${formatter.format(inicio)} - ${formatter.format(fim)}`;
}

export default function AgendaAtendimentosPage() {
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);
  const [dialogoConclusaoAberto, setDialogoConclusaoAberto] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [inicioSemana, setInicioSemana] = useState(() => inicioDaSemana(new Date()));
  const [idsColaboradoresFiltrados, setIdsColaboradoresFiltrados] = useState([]);
  const [painelFiltroAberto, setPainelFiltroAberto] = useState(false);
  const queryClient = useQueryClient();
  const sessao = obterSessaoArmazenada();
  const colaboradorLogadoId = Number(sessao?.colaboradorId ?? 0);
  const colaboradorLogadoNome = sessao?.colaboradorNome ?? '';
  const { data: configuracoes = configuracoesPadrao } = useConfiguracoesSistema();

  const fimSemana = useMemo(() => fimDaSemana(inicioSemana), [inicioSemana]);
  const diasSemana = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicioSemana);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [inicioSemana]);

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-atendimento'],
    queryFn: getClientes,
  });

  const { data: colaboradores = [] } = useQuery({
    queryKey: ['colaboradores-atendimento'],
    queryFn: getColaboradores,
  });

  const { data: atendimentosApi = [], isLoading: carregandoAtendimentos } = useQuery({
    queryKey: ['atendimentos', paraIso(inicioSemana), paraIso(fimSemana)],
    queryFn: () => getAtendimentos(paraIso(inicioSemana), paraIso(fimSemana)),
    refetchOnWindowFocus: false,
  });

  const clientesPorId = useMemo(() => {
    const mapa = new Map();
    clientes.forEach((c) => mapa.set(c.id, c.nome));
    return mapa;
  }, [clientes]);

  const colaboradoresPorId = useMemo(() => {
    const mapa = new Map();
    colaboradores.forEach((c) => mapa.set(c.id, c.nome));
    return mapa;
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
        cadastradoPorNome: colaboradoresPorId.get(item.cadastradoPorColaboradorId) ?? null,
        clienteNome: clientesPorId.get(item.clienteId) ?? null,
        dataHoraInicio: new Date(item.dataHoraInicio),
        dataHoraFim: item.dataHoraFim ? new Date(item.dataHoraFim) : null,
        status: item.status,
        observacaoConclusao: item.observacaoConclusao ?? null,
        concluidoPorColaboradorId: item.concluidoPorColaboradorId ?? null,
        dataHoraConclusao: item.dataHoraConclusao ? new Date(item.dataHoraConclusao) : null,
        concluidoPorNome: item.concluidoPorColaboradorId
          ? colaboradoresPorId.get(item.concluidoPorColaboradorId) ?? null
          : null,
        ativo: item.ativo,
        colaboradoresIds: item.colaboradoresIds ?? [],
        notificacoesMinutosAntecedencia: item.notificacoesMinutosAntecedencia ?? [],
        colaboradoresNomes: (item.colaboradoresIds ?? [])
          .map((id) => colaboradoresPorId.get(id))
          .filter(Boolean),
      }));
  }, [atendimentosApi, clientesPorId, colaboradoresPorId]);

  const atendimentosFiltrados = useMemo(() => {
    if (idsColaboradoresFiltrados.length === 0) return atendimentos;

    return atendimentos.filter((atendimento) =>
      atendimento.colaboradoresIds?.some((id) => idsColaboradoresFiltrados.includes(id))
    );
  }, [atendimentos, idsColaboradoresFiltrados]);

  const toggleFiltroColaborador = (colaboradorId) => {
    setIdsColaboradoresFiltrados((prev) =>
      prev.includes(colaboradorId)
        ? prev.filter((id) => id !== colaboradorId)
        : [...prev, colaboradorId]
    );
  };

  useEffect(() => {
    if (colaboradorLogadoId > 0 && idsColaboradoresFiltrados.length === 0) {
      setIdsColaboradoresFiltrados([colaboradorLogadoId]);
    }
  }, [colaboradorLogadoId, idsColaboradoresFiltrados.length]);

  const criar = useMutation({
    mutationFn: criarAtendimento,
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setFormularioAberto(false);
      toast.success('Atendimento agendado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao agendar atendimento.'),
  });

  const atualizar = useMutation({
    mutationFn: ({ id, payload }) => atualizarAtendimento(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setFormularioAberto(false);
      setAtendimentoSelecionado(null);
      toast.success('Atendimento alterado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao alterar atendimento.'),
  });

  const concluir = useMutation({
    mutationFn: ({ id, observacaoConclusao }) =>
      marcarAtendimentoComoRealizado(id, observacaoConclusao),
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setDialogoConclusaoAberto(false);
      setVisualizacaoAberta(false);
      setAtendimentoSelecionado(null);
      toast.success('Atendimento marcado como concluído.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao concluir atendimento.'),
  });

  const desmarcarConclusao = useMutation({
    mutationFn: marcarAtendimentoComoAgendado,
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setVisualizacaoAberta(false);
      setAtendimentoSelecionado(null);
      toast.success('Atendimento retornou para agendado.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao desmarcar atendimento concluído.'),
  });

  const excluir = useMutation({
    mutationFn: inativarAtendimento,
    onSuccess: () => {
      queryClient.invalidateQueries(['atendimentos']);
      setVisualizacaoAberta(false);
      setAtendimentoSelecionado(null);
      toast.success('Atendimento excluído com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao excluir atendimento.'),
  });

  const handleSalvar = (payload) => {
    if (atendimentoSelecionado?.id) {
      atualizar.mutate({ id: atendimentoSelecionado.id, payload });
      return;
    }

    criar.mutate(payload);
  };

  const handleAbrirNovo = () => {
    setAtendimentoSelecionado(null);
    setFormularioAberto(true);
  };

  const handleAbrirVisualizacao = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
    setVisualizacaoAberta(true);
  };

  const handleEditarDaVisualizacao = () => {
    if (atendimentoSelecionado?.status === 'R') return;
    setVisualizacaoAberta(false);
    setFormularioAberto(true);
  };

  const handleAlternarConclusao = () => {
    if (!atendimentoSelecionado?.id) return;

    if (atendimentoSelecionado.status === 'R') {
      desmarcarConclusao.mutate(atendimentoSelecionado.id);
      return;
    }

    setVisualizacaoAberta(false);
    setDialogoConclusaoAberto(true);
  };

  const handleConfirmarConclusao = (observacaoConclusao) => {
    if (!atendimentoSelecionado?.id) return;

    concluir.mutate({
      id: atendimentoSelecionado.id,
      observacaoConclusao: observacaoConclusao?.trim() ? observacaoConclusao.trim() : null,
    });
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
              <p className="text-muted-foreground">
                Visualize e agende atendimentos por data e hora
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {
              const anterior = new Date(inicioSemana);
              anterior.setDate(anterior.getDate() - 7);
              setInicioSemana(inicioDaSemana(anterior));
            }}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {formatarPeriodo(inicioSemana, fimSemana)}
            </span>
            <Button variant="outline" onClick={() => {
              const proximo = new Date(inicioSemana);
              proximo.setDate(proximo.getDate() + 7);
              setInicioSemana(inicioDaSemana(proximo));
            }}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => setInicioSemana(inicioDaSemana(new Date()))} variant="outline">
              Hoje
            </Button>
            <Button
              onClick={handleAbrirNovo}
              className="flex items-center gap-2 bg-brand-blue hover:bg-brand-blue-dark"
            >
              <Plus className="h-4 w-4" />
              Novo Atendimento
            </Button>
          </div>
        </div>

        {carregandoAtendimentos ? (
          <div className="p-6">Carregando agenda...</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPainelFiltroAberto((prev) => !prev)}
                >
                  {painelFiltroAberto ? 'Ocultar filtro de colaboradores' : 'Mostrar filtro de colaboradores'}
                </Button>
                {idsColaboradoresFiltrados.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIdsColaboradoresFiltrados([])}
                  >
                    Limpar filtro
                  </Button>
                )}
              </div>

              {painelFiltroAberto && (
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
                          checked={idsColaboradoresFiltrados.includes(colaborador.id)}
                          onChange={() => toggleFiltroColaborador(colaborador.id)}
                        />
                        <span>{colaborador.nome}</span>
                      </label>
                    ))}
                </div>
              )}
            </div>

            <CalendarioAtendimentos
              dias={diasSemana}
              atendimentos={atendimentosFiltrados}
              horaInicioAgenda={configuracoes.horaInicioAgenda}
              horaFimAgenda={configuracoes.horaFimAgenda}
              aoSelecionarAtendimento={handleAbrirVisualizacao}
            />
          </div>
        )}

        <FormularioAtendimento
          open={formularioAberto}
          onOpenChange={setFormularioAberto}
          clientes={clientes}
          colaboradores={colaboradores}
          atendimento={atendimentoSelecionado}
          colaboradorLogadoNome={colaboradorLogadoNome}
          horaInicioAgenda={configuracoes.horaInicioAgenda}
          horaFimAgenda={configuracoes.horaFimAgenda}
          aoSalvar={handleSalvar}
          salvando={criar.isPending || atualizar.isPending}
        />

        <DialogoVisualizarAtendimento
          open={visualizacaoAberta}
          onOpenChange={setVisualizacaoAberta}
          atendimento={atendimentoSelecionado}
          aoEditar={handleEditarDaVisualizacao}
          aoAlternarConclusao={handleAlternarConclusao}
          aoExcluir={() =>
            atendimentoSelecionado?.id &&
            atendimentoSelecionado?.status !== 'R' &&
            excluir.mutate(atendimentoSelecionado.id)
          }
          alternandoConclusao={concluir.isPending || desmarcarConclusao.isPending}
          excluindo={excluir.isPending}
        />

        <DialogoConcluirAtendimento
          open={dialogoConclusaoAberto}
          onOpenChange={setDialogoConclusaoAberto}
          atendimento={atendimentoSelecionado}
          aoConfirmar={handleConfirmarConclusao}
          salvando={concluir.isPending}
        />

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
