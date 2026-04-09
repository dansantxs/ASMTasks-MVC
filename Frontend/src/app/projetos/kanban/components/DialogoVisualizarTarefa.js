'use client';

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Folder, Building2, User, Tag, Play, Pause, Clock, History, UserCog, Paperclip } from 'lucide-react';
import { Button } from '../../../../ui/base/button';
import { useQuery } from '@tanstack/react-query';
import { getHistoricoTarefa, getHistoricoProjeto } from '../api/kanban';
import DialogoPausarTarefa from './DialogoPausarTarefa';
import DialogoAnexosTarefa from '../../components/DialogoAnexosTarefa';

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    : '—';

const getTipoLabel = (tipo) => {
  if (tipo === 'E') return 'Movida para etapa';
  if (tipo === 'A') return 'Responsável atribuído';
  if (tipo === 'I') return 'Elaboração iniciada';
  if (tipo === 'P') return 'Elaboração pausada';
  if (tipo === 'F') return 'Elaboração finalizada';
  if (tipo === 'C') return 'Projeto concluído';
  if (tipo === 'R') return 'Projeto reaberto';
  return tipo;
};

const getTipoCor = (tipo) => {
  if (tipo === 'E') return 'bg-blue-100 text-blue-700';
  if (tipo === 'A') return 'bg-amber-100 text-amber-700';
  if (tipo === 'I') return 'bg-green-100 text-green-700';
  if (tipo === 'P') return 'bg-orange-100 text-orange-700';
  if (tipo === 'F') return 'bg-purple-100 text-purple-700';
  if (tipo === 'C') return 'bg-teal-100 text-teal-700';
  if (tipo === 'R') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-700';
};

const HISTORICO_PAGINA = 5;

export default function DialogoVisualizarTarefa({
  open,
  onOpenChange,
  tarefa,
  colaboradorLogadoId,
  ehAdmin,
  colaboradores = [],
  onIniciarTarefa,
  isIniciando,
  onPausarTarefa,
  isPausando,
  onTrocarColaborador,
  isTrocando,
}) {
  const [dialogoPausaAberto, setDialogoPausaAberto] = useState(false);
  const [anexosAbertos, setAnexosAbertos] = useState(false);
  const [historicoVisiveis, setHistoricoVisiveis] = useState(HISTORICO_PAGINA);
  const [novoColaboradorId, setNovoColaboradorId] = useState(null);
  const [trocandoResponsavel, setTrocandoResponsavel] = useState(false);

  const { data: historicoTarefa = [] } = useQuery({
    queryKey: ['tarefa-historico', tarefa?.id],
    queryFn: () => getHistoricoTarefa(tarefa.id),
    enabled: open && !!tarefa?.id,
  });

  const { data: historicoProjeto = [] } = useQuery({
    queryKey: ['projeto-historico', tarefa?.projetoId],
    queryFn: () => getHistoricoProjeto(tarefa.projetoId),
    enabled: open && !!tarefa?.projetoId,
  });

  const historico = useMemo(() => {
    const projetoNormalizado = historicoProjeto.map((item) => ({
      id: `p-${item.id}`,
      tipo: item.tipo,
      colaboradorNome: item.realizadoPorColaboradorNome ?? null,
      etapaNome: null,
      observacao: null,
      dataHoraAcao: item.dataHoraAcao,
      realizadoPorColaboradorNome: item.realizadoPorColaboradorNome,
    }));
    return [...historicoTarefa, ...projetoNormalizado].sort(
      (a, b) => new Date(b.dataHoraAcao) - new Date(a.dataHoraAcao)
    );
  }, [historicoTarefa, historicoProjeto]);

  const handleOpenChange = (v) => {
    if (!v) {
      setHistoricoVisiveis(HISTORICO_PAGINA);
      setTrocandoResponsavel(false);
      setNovoColaboradorId(null);
      setAnexosAbertos(false);
    }
    onOpenChange(v);
  };

  const handleAbrirAnexos = () => {
    setAnexosAbertos(true);
  };

  const podeTrocarResponsavel =
    tarefa?.etapaId != null &&
    (ehAdmin || tarefa?.colaboradorResponsavelId == null || tarefa?.colaboradorResponsavelId === colaboradorLogadoId);

  const handleAbrirTrocaResponsavel = () => {
    setNovoColaboradorId(tarefa?.colaboradorResponsavelId ?? null);
    setTrocandoResponsavel(true);
  };

  const handleConfirmarTrocaResponsavel = () => {
    if (novoColaboradorId === (tarefa?.colaboradorResponsavelId ?? null)) {
      setTrocandoResponsavel(false);
      return;
    }
    onTrocarColaborador?.(tarefa.id, novoColaboradorId);
    setTrocandoResponsavel(false);
  };

  if (!tarefa) return null;

  const podeIniciar =
    tarefa.etapaId !== null &&
    tarefa.etapaId !== undefined &&
    tarefa.colaboradorResponsavelId !== null &&
    tarefa.colaboradorResponsavelId !== undefined &&
    !tarefa.dataHoraInicio &&
    (ehAdmin || tarefa.colaboradorResponsavelId === colaboradorLogadoId);

  const podePausar =
    !!tarefa.dataHoraInicio &&
    (ehAdmin || tarefa.colaboradorResponsavelId === colaboradorLogadoId);

  const handleConfirmarPausa = (observacao) => {
    onPausarTarefa?.(tarefa, observacao);
    setDialogoPausaAberto(false);
  };

  return (
    <>
    <DialogoPausarTarefa
      open={dialogoPausaAberto}
      onOpenChange={setDialogoPausaAberto}
      tarefa={tarefa}
      onConfirmar={handleConfirmarPausa}
      isConfirmando={isPausando}
    />
    <DialogoAnexosTarefa
      open={anexosAbertos}
      onOpenChange={setAnexosAbertos}
      tarefaId={tarefa?.id}
      tarefaTitulo={tarefa?.titulo}
    />
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <div
            className="h-1.5 rounded-t-xl flex-shrink-0"
            style={{ backgroundColor: tarefa.prioridadeCor ?? '#e5e7eb' }}
          />
          <div className="p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-5">
              <Dialog.Title className="text-base font-semibold text-gray-900 leading-snug">
                {tarefa.titulo}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-4">
              {tarefa.descricao && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Descrição</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{tarefa.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Prioridade</p>
                    {tarefa.prioridadeNome ? (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: tarefa.prioridadeCor ?? '#6b7280' }}
                      >
                        {tarefa.prioridadeNome}
                      </span>
                    ) : (
                      <p className="text-sm text-gray-600">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Responsável</p>
                    <p className="text-sm text-gray-700">{tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Folder className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Projeto</p>
                    <p className="text-sm text-gray-700">{tarefa.projetoTitulo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="text-sm text-gray-700">{tarefa.clienteNome}</p>
                  </div>
                </div>
              </div>

              {/* Trocar responsável */}
              {podeTrocarResponsavel && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <UserCog className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Responsável</p>
                  </div>
                  {trocandoResponsavel ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={novoColaboradorId ?? ''}
                        onChange={(e) => setNovoColaboradorId(e.target.value ? Number(e.target.value) : null)}
                        className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                      >
                        <option value="">Sem responsável</option>
                        {colaboradores.map((col) => (
                          <option key={col.id} value={col.id}>{col.nome}</option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        className="bg-brand-blue hover:bg-brand-blue-dark text-white text-xs px-2 py-1"
                        onClick={handleConfirmarTrocaResponsavel}
                        disabled={isTrocando}
                      >
                        {isTrocando ? '...' : 'Salvar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => setTrocandoResponsavel(false)}
                        disabled={isTrocando}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700">{tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}</p>
                      <button
                        onClick={handleAbrirTrocaResponsavel}
                        className="text-xs text-brand-blue hover:underline font-medium"
                      >
                        Trocar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status de elaboração */}
              {tarefa.etapaId && tarefa.colaboradorResponsavelId && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Elaboração</p>
                  </div>
                  {tarefa.dataHoraInicio ? (
                    <p className="text-sm text-green-700 font-medium">
                      Iniciada em {formatDateTime(tarefa.dataHoraInicio)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Não iniciada</p>
                  )}
                </div>
              )}

              {/* Histórico */}
              {historico.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <History className="h-3.5 w-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Histórico
                      <span className="ml-1 normal-case font-normal text-gray-400">({historico.length})</span>
                    </p>
                  </div>
                  <div className="space-y-2 pr-1">
                    {historico.slice(0, historicoVisiveis).map((item) => (
                      <div key={item.id} className="flex items-start gap-2 text-xs">
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded font-medium ${getTipoCor(item.tipo)}`}>
                          {getTipoLabel(item.tipo)}
                        </span>
                        <div className="text-gray-600 min-w-0">
                          {item.tipo === 'E' && (
                            <span>
                              {item.etapaNome ? `→ ${item.etapaNome}` : '→ Sem etapa'}
                              {item.colaboradorNome ? ` · ${item.colaboradorNome}` : ''}
                            </span>
                          )}
                          {item.tipo === 'A' && (
                            <span>{item.colaboradorNome ?? 'Sem responsável'}</span>
                          )}
                          {item.tipo === 'I' && (
                            <span>{item.colaboradorNome ?? '—'}</span>
                          )}
                          {item.tipo === 'P' && (
                            <span>
                              {item.colaboradorNome ?? '—'}
                              {item.observacao && (
                                <span className="ml-1 italic text-gray-500">· "{item.observacao}"</span>
                              )}
                            </span>
                          )}
                          {item.tipo === 'F' && (
                            <span>{item.colaboradorNome ?? '—'}</span>
                          )}
                          {(item.tipo === 'C' || item.tipo === 'R') && (
                            <span>{item.colaboradorNome ?? '—'}</span>
                          )}
                          <span className="ml-1 text-gray-400">{formatDateTime(item.dataHoraAcao)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {historicoVisiveis < historico.length && (
                    <button
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => setHistoricoVisiveis((v) => v + HISTORICO_PAGINA)}
                    >
                      Ver mais ({historico.length - historicoVisiveis} restantes)
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 gap-3">
              <div className="flex gap-2">
                {podeIniciar && (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    onClick={() => onIniciarTarefa?.(tarefa)}
                    disabled={isIniciando || isPausando}
                  >
                    <Play className="h-3.5 w-3.5" />
                    {isIniciando ? 'Iniciando...' : 'Iniciar Tarefa'}
                  </Button>
                )}
                {podePausar && (
                  <Button
                    className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                    onClick={() => setDialogoPausaAberto(true)}
                    disabled={isPausando || isIniciando}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    {isPausando ? 'Pausando...' : 'Pausar Tarefa'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleAbrirAnexos}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Arquivos
                </Button>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
}
