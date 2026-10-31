# Início e Kanban: cliente em negrito, data visível e mais recentes primeiro

- **Status:** rascunho
- **Pedido por:** Álvaro (folha impressa de pedidos)
- **Branch:** `feat/inicio-kanban-cliente-negrito-data`
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `dominio/etapas-e-fluxo.md` (Kanban); `dashboard.md` (a escrever)

## Contexto

"Início" é o Dashboard (a raiz do sistema leva para ele). O pedido é ler mais rápido de quem é
cada item e de quando ele é, nas listas do Início e nos cartões do Kanban.

## Critérios de aceite

- **CA-1.** No Kanban, o nome do cliente aparece em negrito no cartão, na coluna e durante o
  arrasto.
- **CA-2.** No Início, o nome do cliente aparece em negrito em todas as listas que o mostram
  (indicadores, Próximos atendimentos, Projetos sem movimentação).
- **CA-3.** No Início, cada item das listas mostra a data de lançamento (ver pergunta 1).
- **CA-4.** O Kanban abre ordenado por **Lançamento, do mais recente para o mais antigo**. Quem já
  escolheu outra ordenação continua com a sua (ela fica guardada no navegador).
- **CA-5.** As listas do Início saem da data mais recente para a mais antiga (ver pergunta 2).
- **CA-6.** O nome do cliente continua seguindo a configuração (razão social ou nome fantasia).

## Perguntas em aberto

1. **Qual data no Início?** Hoje cada linha já mostra a "Última ação" (quem e quando) ou, no
   atendimento, "Agendado para". A data que falta é a do **lançamento** da tarefa (quando a
   demanda entrou)? *Recomendação:* sim, uma linha "Lançado em dd/mm/aa" em cada item.
2. **Ordem do Início.** Na 1.11, a pedido do Álvaro, os indicadores passaram a sair ordenados
   **por etapa e colaborador**. Ordenar por data substitui isso? *Recomendação:* data decrescente
   passa a ser a ordem principal, e etapa e colaborador viram desempate.
3. **Quem já escolheu outra ordem no Kanban** volta para o padrão novo uma vez, ou mantém a sua?
   *Recomendação:* mantém (CA-4).
