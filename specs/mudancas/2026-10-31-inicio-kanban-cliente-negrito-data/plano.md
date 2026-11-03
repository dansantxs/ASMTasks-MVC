# Plano — Início e Kanban: cliente em negrito, data e ordem

Spec: [spec.md](spec.md)

## Abordagem

A ordem das listas do Início precisa ser feita **no servidor**: cada indicador traz só os
primeiros itens (`TOP (@Limite)`), e reordenar no navegador só embaralharia esses primeiros, em
vez de trazer os mais recentes. Então o Dashboard ganha um parâmetro de ordem, e o navegador
guarda a escolha.

## Backend

- `GET /dashboard` ganha `?ordem=etapa|recentes` (padrão `etapa`). Valor desconhecido vale `etapa`.
- `DashboardDAO`: `OrdemTarefaEtapaColaborador` vira a função `OrdemTarefa(string ordem)`:
  - `etapa`: a ordem de hoje, sem mudança;
  - `recentes`: `COALESCE(t.DataCadastro, pr.DataCadastro) DESC` e, como desempate, a ordem de hoje.
  A troca vale só para as listas de tarefas dos indicadores (CA-7). Os rankings por colaborador
  continuam com a ordem de hoje, porque lá a ordem é a do total.
- `ColunasTarefa` ganha `COALESCE(t.DataCadastro, pr.DataCadastro) AS DataLancamento`, e
  `DashboardLinhaDTO` ganha `DataLancamento` (CA-4). É o mesmo critério do "Lançado por" do
  Relatório de Comissão, que cai na data do projeto quando a tarefa é anterior à 1.9.0.

## Frontend

### Início (`dashboard/page.js`)

- Seletor "Ordem: Etapa e colaborador / Mais recentes primeiro" ao lado do seletor de período.
  Valor em `usePreferenciaLocal('asm_inicio_ordem', 'etapa')` (CA-5, CA-6), repassado na
  consulta e na chave do React Query.
- `LinhaIndicador`: o cliente sai da linha de contexto e vira um trecho próprio em negrito,
  "Projeto · **Cliente**" (CA-2), e ganha a linha "Lançado em dd/mm/aa" (CA-4).
- `ProximosAtendimentos` e `ProjetosSemMovimentacao`: o nome do cliente em negrito.

### Kanban

- `CartaoTarefa`: o nome do cliente em `font-semibold` (CA-1). O cartão do arrasto é o mesmo
  componente, então vale para ele também.
- `kanban/page.js`: `ORDENACAO_PADRAO = { ordenacao: 'lancamento', direcao: 'desc' }` (CA-8).
  Quem já tem uma ordenação guardada continua com ela, porque a leitura do `localStorage` já tem
  prioridade sobre o padrão.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Backend/API/Controllers/DashboardController.cs` | Parâmetro `ordem` |
| `Backend/API/DB/DAOs/DashboardDAO.cs` | `OrdemTarefa(ordem)`, coluna `DataLancamento` |
| `Backend/API/DTOs/DashboardDTO.cs` | `DataLancamento` em `DashboardLinhaDTO` |
| `Frontend/src/app/dashboard/page.js` (e o `api/` dele) | Seletor de ordem, negrito, "Lançado em" |
| `Frontend/src/app/projetos/kanban/components/CartaoTarefa.js` | Cliente em negrito |
| `Frontend/src/app/projetos/kanban/page.js` | Ordenação padrão |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- A `fix/atendimento-nome-cliente` vem depois desta e mexe nos mesmos trechos de nome do cliente;
  por isso a ordem de merge.
- Com "Mais recentes primeiro", a tarefa antiga e parada some do topo das listas. É o esperado,
  mas vale lembrar o Álvaro de que a ordem de antes continua a um clique.

## Como verificar

- **CA-1, CA-2, CA-3:** com as duas configurações de nome, no Início e no Kanban (inclusive arrastando).
- **CA-4:** uma tarefa anterior à 1.9.0 mostra a data do projeto.
- **CA-5 a CA-7:** trocar a ordem, recarregar a página e ver a escolha mantida; conferir na base
  de desenvolvimento que "Mais recentes" traz as últimas tarefas lançadas mesmo quando o indicador
  tem mais itens que o limite.
- **CA-8:** navegador sem preferência abre em Lançamento decrescente; com preferência, mantém.
- Builds do backend e do frontend.
