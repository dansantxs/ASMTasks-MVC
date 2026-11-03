# Dashboard: tarefas concluídas nos últimos 6 meses

- **Status:** rascunho
- **Pedido por:** Daniel, 2026-11-03
- **Branch:** `feat/dashboard-tarefas-ultimos-6-meses`
- **Versão:**
- **Specs de domínio afetadas:** `dashboard.md` (a escrever); `dominio/comissao.md` (COM-03, COM-10)

## Contexto

O Início tem o gráfico "Realizados — Últimos 6 Meses" para os atendimentos: uma coluna por mês,
com a lista ao passar o mouse. Não existe o mesmo para as tarefas.

## Comportamento esperado

Um gráfico igual, na seção de Tarefas do Início: "Concluídas — Últimos 6 Meses".

## Critérios de aceite

- **CA-1.** Seis colunas, do mês atual e dos cinco anteriores, com a quantidade de tarefas
  concluídas em cada mês. Mês sem nenhuma aparece com zero.
- **CA-2.** A tarefa conta no mês em que **entrou na etapa final**. Reaberta e concluída de novo no
  mesmo mês, conta uma vez (o mesmo critério do card "Concluídas no período").
- **CA-3.** Passando o mouse sobre um mês, aparece a lista das tarefas daquele mês; clicando, a
  lista fica fixa, como no gráfico dos atendimentos.
- **CA-4.** O mês atual fica destacado, como no gráfico dos atendimentos.
- **CA-5.** Com o filtro de colaborador do Início, o gráfico mostra só as tarefas creditadas a
  essa pessoa (ver pergunta 1).
- **CA-6.** A ordem da lista de cada mês segue o seletor de ordem do Início, e o nome do cliente
  segue a configuração.

## Perguntas em aberto

1. **De quem é a tarefa, com o filtro de colaborador?** A tarefa pode contar para quem a elaborou
   (o crédito da Comissão, COM-10) ou para quem estava responsável quando ela foi concluída.
   *Recomendação:* quem elaborou, para o gráfico bater com o ranking de tarefas concluídas e com a
   Comissão.
2. **Um gráfico só, ou junto do de atendimentos?** Pode ser um gráfico novo ao lado do de
   atendimentos, ou o mesmo gráfico com duas barras por mês (tarefas e atendimentos).
   *Recomendação:* um gráfico novo, igual ao de hoje, na seção de Tarefas; duas barras no mesmo
   gráfico ficam difíceis de ler com a lista ao passar o mouse.
