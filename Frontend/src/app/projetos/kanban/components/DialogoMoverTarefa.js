'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../../../../components/ui/base/button';
import { Label } from '../../../../components/ui/form/label';
import { Combobox } from '../../../../components/ui/form/combobox';
import { colaboradoresDoSuporte, montarOpcoesColaboradores, montarOpcoesSuporte } from '../utils/opcoesResponsavel';
import { ehEtapaElaboracao } from '../../../../utils/situacaoTarefa';

export default function DialogoMoverTarefa({ open, onOpenChange, tarefa, etapaDestino, colaboradores = [], onConfirmar, isMovendo }) {
  const [colaboradorId, setColaboradorId] = useState(null);
  const [mostrarTodosSetores, setMostrarTodosSetores] = useState(false);

  const moverParaAtendimento = etapaDestino?.id == null;
  const moverParaTeste = !moverParaAtendimento && !!etapaDestino?.ehEtapaTeste;
  const moverParaElaboracao = !moverParaAtendimento && !moverParaTeste && ehEtapaElaboracao(etapaDestino?.nome);
  const suporte = colaboradoresDoSuporte(colaboradores);

  useEffect(() => {
    if (!open) return;

    if (moverParaAtendimento) {
      setColaboradorId(null);
      setMostrarTodosSetores(false);
      return;
    }

    if (moverParaTeste) {
      // Primeira vez no teste: sem responsavel. Voltando para o teste: quem estava nele da
      // ultima vez - desde que ainda seja do Suporte, senao a opcao nem existe na lista.
      const anterior = tarefa?.ultimoResponsavelTesteId ?? null;
      setColaboradorId(suporte.some((col) => col.id === anterior) ? anterior : null);
      setMostrarTodosSetores(false);
      return;
    }

    // Voltando para a elaboracao: quem desenvolveu na ultima passagem por ela, como no teste.
    // Se essa pessoa for de outro setor, a lista abre em "todos os setores" para ela aparecer
    // selecionada, em vez de o campo ficar com um valor que nao existe entre as opcoes.
    const ultimoDev = moverParaElaboracao ? tarefa?.ultimoResponsavelElaboracaoId ?? null : null;
    const devDisponivel = ultimoDev != null && colaboradores.some((col) => col.id === ultimoDev);

    if (devDisponivel) {
      const doSetorDaTarefa = colaboradores.some(
        (col) => col.id === ultimoDev && col.setorId === tarefa?.setorId
      );
      setColaboradorId(ultimoDev);
      setMostrarTodosSetores(!!tarefa?.setorId && !doSetorDaTarefa);
      return;
    }

    setColaboradorId(tarefa?.colaboradorResponsavelId ?? null);
    setMostrarTodosSetores(false);
    // `suporte` e `colaboradores` ficam de fora de proposito: so a abertura do dialogo deve
    // escolher o padrao.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tarefa, moverParaAtendimento, moverParaTeste, moverParaElaboracao]);

  const handleConfirmar = () => {
    onConfirmar(colaboradorId);
  };

  if (!tarefa) return null;

  const nomeEtapaDestino = etapaDestino?.nome ?? 'Atendimento';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content aria-describedby={undefined} className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
            Mover tarefa
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-5">
            Movendo <span className="font-medium text-gray-700">&ldquo;{tarefa.titulo}&rdquo;</span> para{' '}
            <span className="font-medium text-gray-700">{nomeEtapaDestino}</span>.
          </Dialog.Description>

          <div className="space-y-4">
            {moverParaAtendimento ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                O responsável será removido automaticamente ao retornar para Atendimento.
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>Responsável</Label>
                  {tarefa?.setorId && !moverParaTeste && (
                    <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={mostrarTodosSetores}
                        onChange={(e) => setMostrarTodosSetores(e.target.checked)}
                        className="rounded"
                      />
                      Mostrar todos os setores
                    </label>
                  )}
                </div>
                <Combobox
                  value={colaboradorId != null ? String(colaboradorId) : ''}
                  onValueChange={(v) => setColaboradorId(v ? Number(v) : null)}
                  placeholder="Sem responsável"
                  searchPlaceholder="Buscar colaborador..."
                  options={
                    moverParaTeste
                      ? montarOpcoesSuporte(colaboradores)
                      : montarOpcoesColaboradores(colaboradores, tarefa?.setorId, mostrarTodosSetores)
                  }
                />
                {moverParaTeste && (
                  <p className="text-xs text-gray-500 mt-1">
                    {suporte.length === 0
                      ? 'Nenhum colaborador ativo no setor Suporte.'
                      : 'Etapa de teste: só colaboradores do setor Suporte.'}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Atual: {tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" tabIndex={-1} onClick={() => onOpenChange(false)} disabled={isMovendo}>
              Cancelar
            </Button>
            <Button
              className="bg-brand-blue hover:bg-brand-blue-dark"
              onClick={handleConfirmar}
              disabled={isMovendo}
            >
              {isMovendo ? 'Movendo...' : 'Confirmar'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
