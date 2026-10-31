// Nome do cliente da tarefa conforme a configuração "Exibição do nome do cliente". Usado no
// cartão (na coluna e durante o arrasto) e no detalhe da tarefa, para os três nunca divergirem.
export function resolverNomeCliente(tarefa, exibicao) {
  if (exibicao === 'nomeFantasia' && tarefa?.clienteNomeFantasia) return tarefa.clienteNomeFantasia;
  return tarefa?.clienteNome;
}
