// Nome do cliente conforme a configuração "Exibição do nome do cliente": o nome fantasia quando
// ela pede e ele existe; senão, a razão social. Uma regra só para o sistema inteiro, para as
// telas não divergirem (como já aconteceu no Kanban, no Dashboard e nos Atendimentos).

/** Itens que trazem o cliente "achatado" (tarefa do Kanban, linhas de relatório). */
export function nomeClienteDaTarefa(item, exibicao) {
  if (exibicao === 'nomeFantasia' && item?.clienteNomeFantasia) return item.clienteNomeFantasia;
  return item?.clienteNome;
}

/** O próprio cadastro de cliente (`nome` e `nomeFantasia`). */
export function nomeClienteDoCadastro(cliente, exibicao) {
  if (exibicao === 'nomeFantasia' && cliente?.nomeFantasia) return cliente.nomeFantasia;
  return cliente?.nome;
}
