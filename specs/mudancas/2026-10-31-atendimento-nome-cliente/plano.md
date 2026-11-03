# Plano — Atendimentos: nome do cliente conforme a configuração

Spec: [spec.md](spec.md)

## Abordagem

Uma regra só para o nome do cliente no frontend inteiro (CA-4). O helper que hoje está em
`projetos/kanban/utils/nomeCliente.js` vai para `Frontend/src/utils/nomeCliente.js`, com duas
entradas, porque os dados chegam em dois formatos:

- `nomeClienteDaTarefa(item, exibicao)`: itens com `clienteNome` e `clienteNomeFantasia` (Kanban,
  relatórios);
- `nomeClienteDoCadastro(cliente, exibicao)`: o cadastro, com `nome` e `nomeFantasia`
  (Atendimentos, filtros).

As duas aplicam a mesma regra: nome fantasia quando a configuração pede e ele existe; senão, a
razão social. O Kanban e o Início passam a importar daqui.

## Atendimentos (`atendimentos/page.js`)

- `clientesPorId` passa a guardar o cadastro inteiro, e não só `c.nome`.
- No mapeamento de cada atendimento: `clienteNome` com `nomeClienteDoCadastro` e a configuração
  (`useConfiguracoesSistema`), mais `clienteRazaoSocial` e `clienteNomeFantasia` separados.
- Lista, cartões, calendário e detalhe já leem `clienteNome` desse mapeamento, então mudam juntos
  (CA-1).
- A busca da tela passa a comparar o termo com os dois nomes (CA-3). Se a tela não tiver busca
  por texto hoje, este critério vira só o do filtro de cliente, que já usa o cadastro.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Frontend/src/utils/nomeCliente.js` | Novo: as duas funções |
| `Frontend/src/app/projetos/kanban/utils/nomeCliente.js` | Removido; importações apontam para o novo |
| `Frontend/src/app/projetos/kanban/components/{ColunaKanban,QuadroKanban,DialogoVisualizarTarefa}.js` | Importação |
| `Frontend/src/app/atendimentos/page.js` | Nome pela configuração, busca pelos dois nomes |
| `Frontend/src/app/atendimentos/components/{CalendarioAtendimentos,DialogoVisualizarAtendimento}.js` | Conferir que só usam `clienteNome` |

## Banco de dados

Sem alteração. O backend não muda: o cadastro de clientes que a tela carrega já traz o nome fantasia.

## Como verificar

- **CA-1, CA-2:** com as duas configurações, lista, cartões, calendário e detalhe.
- **CA-3:** buscar um atendimento pelo nome fantasia e pela razão social.
- **CA-4:** Kanban e Início continuam iguais depois da troca de importação.
- Build do frontend.
