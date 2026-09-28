// "Reservado" não é uma etapa cadastrada: é a tarefa que está na etapa de elaboração e que
// ninguém começou ainda — o que vai ser feito, separado do que já está em elaboração.
//
// O critério é o histórico, não o status do momento: uma tarefa que já foi iniciada e volta do
// teste para a elaboração fica ociosa de novo, mas NÃO volta a ser reservada, porque ela já foi
// elaborada. Quem responde isso é o campo `elaboracaoJaIniciada` (ver TarefaSql no backend).
//
// A etapa de elaboração é reconhecida pelo NOME, igual ao Relatório de Comissão e a
// TarefaSql.EhEtapaElaboracao. Renomear a etapa exige ajustar os três.

export const ROTULO_RESERVADO = 'Reservado';

export const ehEtapaElaboracao = (nomeEtapa) => /elabora|desenvolv/i.test(nomeEtapa ?? '');

export const ehReservado = (nomeEtapa, elaboracaoJaIniciada) =>
  ehEtapaElaboracao(nomeEtapa) && !elaboracaoJaIniciada;

/** Nome a exibir para a etapa atual da tarefa: "Reservado" no lugar da elaboração não iniciada. */
export const rotuloEtapa = (nomeEtapa, elaboracaoJaIniciada) =>
  ehReservado(nomeEtapa, elaboracaoJaIniciada) ? ROTULO_RESERVADO : nomeEtapa;
