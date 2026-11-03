'use client';

import { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../../../../components/ui/base/button';
import { Label } from '../../../../components/ui/form/label';
import { Combobox } from '../../../../components/ui/form/combobox';
import { colaboradoresDoSuporte, montarOpcoesColaboradores, montarOpcoesSuporte } from '../utils/opcoesResponsavel';
import { responsavelSugerido } from '../utils/regrasMover';

// Valor do seletor que aplica a sugestão de ETP-06 tarefa por tarefa, quando ela não é a mesma
// para todas. Não é id de colaborador.
const MANTER_SUGERIDO = '__manter';

/**
 * Diálogo de mover uma ou várias tarefas para a mesma etapa.
 *
 * @param {array} tarefas    as que vão ser movidas
 * @param {array} bloqueadas as que estavam selecionadas mas a pessoa não pode mover:
 *                           [{ tarefa, motivo }]. Aparecem riscadas e não são enviadas.
 * @param {func}  onConfirmar recebe [{ tarefa, colaboradorResponsavelId }]
 */
export default function DialogoMoverTarefa({ open, onOpenChange, tarefas = [], bloqueadas = [], etapaDestino, colaboradores = [], onConfirmar, isMovendo }) {
  const [colaboradorId, setColaboradorId] = useState(null);
  const [mostrarTodosSetores, setMostrarTodosSetores] = useState(false);

  const varias = tarefas.length > 1;
  const tarefa = tarefas[0] ?? null;
  const moverParaAtendimento = etapaDestino?.id == null;
  const moverParaTeste = !moverParaAtendimento && !!etapaDestino?.ehEtapaTeste;
  const suporte = colaboradoresDoSuporte(colaboradores);

  const sugestoes = useMemo(
    () => tarefas.map((t) => ({ tarefa: t, ...responsavelSugerido(t, etapaDestino, colaboradores) })),
    // Só a abertura do diálogo escolhe o padrão; `colaboradores` fica de fora de propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tarefas, etapaDestino]
  );
  const sugestoesIguais = sugestoes.every((s) => s.colaboradorId === sugestoes[0]?.colaboradorId);

  // Setor das opções: o da tarefa, ou todos quando as tarefas são de setores diferentes.
  const setorComum = tarefas.every((t) => t.setorId === tarefa?.setorId) ? tarefa?.setorId ?? null : null;

  useEffect(() => {
    if (!open || sugestoes.length === 0) return;
    if (sugestoesIguais) {
      setColaboradorId(sugestoes[0].colaboradorId);
      setMostrarTodosSetores(sugestoes[0].mostrarTodosSetores);
    } else {
      setColaboradorId(MANTER_SUGERIDO);
      setMostrarTodosSetores(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sugestoes]);

  const handleConfirmar = () => {
    onConfirmar(
      sugestoes.map((s) => ({
        tarefa: s.tarefa,
        colaboradorResponsavelId: colaboradorId === MANTER_SUGERIDO ? s.colaboradorId : colaboradorId,
      }))
    );
  };

  if (!tarefa) return null;

  const nomeEtapaDestino = etapaDestino?.nome ?? 'Atendimento';
  const opcoesBase = moverParaTeste
    ? montarOpcoesSuporte(colaboradores)
    : montarOpcoesColaboradores(colaboradores, setorComum, mostrarTodosSetores);
  const opcoes = sugestoesIguais
    ? opcoesBase
    : [{ value: MANTER_SUGERIDO, label: 'Manter o sugerido de cada tarefa' }, ...opcoesBase];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content aria-describedby={undefined} className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
          <Dialog.Title className="text-base font-semibold text-gray-900 mb-1">
            {varias ? `Mover ${tarefas.length} tarefas` : 'Mover tarefa'}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-500 mb-5">
            {varias ? (
              <>Movendo {tarefas.length} tarefas para{' '}</>
            ) : (
              <>Movendo <span className="font-medium text-gray-700">&ldquo;{tarefa.titulo}&rdquo;</span> para{' '}</>
            )}
            <span className="font-medium text-gray-700">{nomeEtapaDestino}</span>.
          </Dialog.Description>

          {(varias || bloqueadas.length > 0) && (
            <ul className="mb-4 max-h-40 overflow-y-auto rounded-lg border bg-gray-50 px-3 py-2 space-y-1 text-xs">
              {tarefas.map((t) => (
                <li key={t.id} className="text-gray-700 truncate" title={t.titulo}>{t.titulo}</li>
              ))}
              {bloqueadas.map(({ tarefa: t, motivo }) => (
                <li key={t.id} className="text-gray-400" title={`${t.titulo}: ${motivo}`}>
                  <span className="line-through">{t.titulo}</span> — não será movida: {motivo}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-4">
            {moverParaAtendimento ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                O responsável será removido automaticamente ao retornar para Atendimento.
              </p>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label>{varias ? 'Responsável para todas' : 'Responsável'}</Label>
                  {setorComum && !moverParaTeste && (
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
                  onValueChange={(v) => setColaboradorId(v === MANTER_SUGERIDO ? v : v ? Number(v) : null)}
                  placeholder="Sem responsável"
                  searchPlaceholder="Buscar colaborador..."
                  options={opcoes}
                />
                {moverParaTeste && (
                  <p className="text-xs text-gray-500 mt-1">
                    {suporte.length === 0
                      ? 'Nenhum colaborador ativo no setor Suporte.'
                      : 'Etapa de teste: só colaboradores do setor Suporte.'}
                  </p>
                )}
                {!varias && (
                  <p className="text-xs text-gray-400 mt-1">
                    Atual: {tarefa.colaboradorResponsavelNome ?? 'Sem responsável'}
                  </p>
                )}
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
