// "Reservado" não é uma etapa cadastrada: é a tarefa que já está na etapa de elaboração mas ainda
// não foi iniciada nela (status "Ociosa") — o que alguém vai fazer, separado do que já começou.
//
// A etapa de elaboração é reconhecida pelo NOME, igual ao Relatório de Comissão e a
// TarefaSql.EhEtapaElaboracao no backend. Renomear a etapa exige ajustar os três.

export const ROTULO_RESERVADO = 'Reservado';

export const ehEtapaElaboracao = (nomeEtapa) => /elabora|desenvolv/i.test(nomeEtapa ?? '');

export const ehReservado = (nomeEtapa, statusAtual) =>
  ehEtapaElaboracao(nomeEtapa) && statusAtual === 'Ociosa';

/** Nome a exibir para a etapa atual da tarefa: "Reservado" no lugar da elaboração não iniciada. */
export const rotuloEtapa = (nomeEtapa, statusAtual) =>
  ehReservado(nomeEtapa, statusAtual) ? ROTULO_RESERVADO : nomeEtapa;
