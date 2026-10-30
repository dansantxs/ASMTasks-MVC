# Plano — Ajustes da 1.14.0

Spec: [spec.md](spec.md)

Cada item é uma branch a partir da `main`, com um commit.

## A. `fix/dashboard-nome-cliente`

Os indicadores já seguem a configuração (`DashboardDAO.MapearLinha`). Só duas listas usam
`c.Nome` direto: **Próximos atendimentos** (`ObterAtendimentosAsync`) e **Projetos sem
movimentação** (`ObterProjetosSemMovimentacaoAsync`). As duas passam a escolher o nome no SQL,
com a mesma regra: nome fantasia quando a configuração pede e ele está preenchido; senão, a razão
social. O frontend não muda.

## B. `fix/kanban-arrastar-nome-cliente`

`QuadroKanban` renderiza o cartão do `DragOverlay` sem `nomeCliente`. A função que resolve o nome
(`resolverNomeCliente`, hoje duplicada em `ColunaKanban` e `DialogoVisualizarTarefa`) vai para
`kanban/utils/` e é usada nos três lugares.

## C. `feat/lembrar-modo-visualizacao`

Nas sete telas, `useState('cards')` vira `usePreferenciaLocal('asm_<tela>_visualizacao', 'cards')`.
O hook já existe e já trata o navegador que não guarda nada (CA-C3).

## D. `feat/lembrar-setor-tarefa`

Em `FormularioProjeto`, a tarefa nova nasce com `setorLogadoId`. Passa a nascer com o último setor
escolhido num lançamento (chave `asm_lancamento_ultimo_setor`, no `localStorage`), desde que ele
ainda esteja entre os setores ativos (CA-D2). O setor é guardado ao salvar o projeto, e não a
cada troca no seletor.

## E. `fix/cliente-data-nascimento-opcional`

- `Cliente.cs`: sai a obrigatoriedade; as validações de data futura e de idade só rodam com data.
- `FormularioCliente.js`: sai a obrigatoriedade e o asterisco do rótulo.
- `clientes/page.js`: o texto do tour não cita mais a data entre os obrigatórios.
- Banco: a coluna `Cliente.DataReferencia` já aceita NULL (`schema.sql` e base de desenvolvimento
  conferidos). Sem script.

## F. `feat/comissao-sem-aprovado-por`

Sai de `comissao/page.js`: o estado do filtro, as opções, o efeito que o zera, o recorte
`gruposPorAprovador` (os usos passam a usar `grupos` direto), o seletor, a linha do resumo de
filtros das exportações e a menção no tour. Fica o "Aprovado por: <nome>" no cabeçalho de cada
item. Na spec de domínio, COM-18 é marcada como removida, sem reaproveitar o número.

## G. `fix/excluir-tarefa-com-historico`

`git revert 901c58f`: aplica sem conflito sobre a `main` atual (testado). Antes do commit, releio
o código que volta (`ProjetosDAO` e `FormularioProjeto`) contra a `main`.

## Como verificar

- Build do backend e do frontend em cada branch.
- **A:** consulta das duas listas na base de desenvolvimento com as duas configurações.
- **E:** salvar cliente sem data via `Cliente.Validar` (sem banco).
- Os demais são de tela; ficam para a sua conferência, como no histórico completo.
