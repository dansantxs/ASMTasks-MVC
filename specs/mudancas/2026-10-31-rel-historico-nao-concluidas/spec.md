# Histórico de Tarefas: sem as concluídas por padrão

- **Status:** rascunho
- **Pedido por:** Álvaro ("trazer só etapas não concluídas")
- **Branch:** `feat/rel-historico-nao-concluidas`
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `relatorios-historico.md` (a escrever)

## Contexto

O Histórico de Tarefas é usado para acompanhar o que está em andamento. As tarefas concluídas
ocupam a maior parte do relatório (em outubro, 321 das 354 tarefas com movimento).

## Critérios de aceite

- **CA-1.** Um filtro novo, **Situação**, com as opções **Não concluídas**, **Concluídas** e
  **Todas**. O relatório abre em **Não concluídas**.
- **CA-2.** Uma tarefa está concluída quando a última etapa dela até o fim do período é a etapa
  final. Tarefa concluída em outubro e reaberta em novembro aparece como concluída no relatório
  de outubro e como não concluída no de novembro.
- **CA-3.** O filtro vale nas duas visões: na Agrupada some o bloco da tarefa; na Detalhada somem
  os eventos dela.
- **CA-4.** O filtro aparece no resumo de filtros das exportações (PDF e Excel) e no tour.
- **CA-5.** O total de tarefas mostrado no relatório respeita o filtro.

## Perguntas em aberto

1. **Concluída "até o fim do período" ou "hoje"?** CA-2 usa o fim do período, que é o retrato do
   período consultado e combina com o histórico completo. A alternativa é a etapa atual da
   tarefa, hoje. *Recomendação:* fim do período.
2. **O filtro fica lembrado** entre uma visita e outra, como a escolha de visão? *Recomendação:*
   não. O relatório sempre abre em "Não concluídas".
