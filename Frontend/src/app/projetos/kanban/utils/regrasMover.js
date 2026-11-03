// Regras de mover tarefa no Kanban, em funções puras: valem para uma tarefa ou para várias de
// uma vez (ver specs/mudancas/2026-10-30-kanban-mover-varias-tarefas). O servidor confere de novo
// a permissão; aqui é para o quadro não oferecer o que vai ser recusado.

import { colaboradoresDoSuporte } from './opcoesResponsavel';
import { ehEtapaElaboracao } from '../../../../utils/situacaoTarefa';

/**
 * Motivo pelo qual a pessoa não pode mover a tarefa, ou null se pode.
 * ETP-03: com responsável, só ele ou um administrador. ETP-15: Atendimento é do administrador.
 */
export function motivoParaNaoMover(tarefa, { ehAdmin, colaboradorLogadoId, etapaDestinoId }) {
  if (ehAdmin) return null;
  if ((tarefa.etapaId ?? null) === null) return 'está em Atendimento, que só um administrador movimenta';
  if (etapaDestinoId === null) return 'só um administrador devolve tarefas para Atendimento';
  if (tarefa.colaboradorResponsavelId != null && tarefa.colaboradorResponsavelId !== colaboradorLogadoId) {
    return `está com ${tarefa.colaboradorResponsavelNome ?? 'outra pessoa'}`;
  }
  return null;
}

export function podeMoverTarefa(tarefa, contexto) {
  return motivoParaNaoMover(tarefa, { ...contexto, etapaDestinoId: undefined }) === null;
}

/**
 * Responsável que o diálogo de mover já traz preenchido (ETP-06), e se a lista precisa abrir em
 * "todos os setores" para essa pessoa aparecer.
 */
export function responsavelSugerido(tarefa, etapaDestino, colaboradores) {
  const moverParaAtendimento = etapaDestino?.id == null;
  if (moverParaAtendimento) return { colaboradorId: null, mostrarTodosSetores: false };

  if (etapaDestino?.ehEtapaTeste) {
    // Primeira vez no teste: sem responsável. Voltando: quem estava nele da última vez, desde que
    // ainda seja do Suporte, senão a opção nem existe na lista.
    const anterior = tarefa?.ultimoResponsavelTesteId ?? null;
    const suporte = colaboradoresDoSuporte(colaboradores);
    return { colaboradorId: suporte.some((col) => col.id === anterior) ? anterior : null, mostrarTodosSetores: false };
  }

  // Voltando para a elaboração: quem desenvolveu na última passagem por ela. Se for de outro
  // setor, a lista abre em "todos os setores" para a pessoa aparecer selecionada.
  if (ehEtapaElaboracao(etapaDestino?.nome)) {
    const ultimoDev = tarefa?.ultimoResponsavelElaboracaoId ?? null;
    const dev = ultimoDev != null ? colaboradores.find((col) => col.id === ultimoDev) : null;
    if (dev) {
      return { colaboradorId: ultimoDev, mostrarTodosSetores: !!tarefa?.setorId && dev.setorId !== tarefa.setorId };
    }
  }

  return { colaboradorId: tarefa?.colaboradorResponsavelId ?? null, mostrarTodosSetores: false };
}
