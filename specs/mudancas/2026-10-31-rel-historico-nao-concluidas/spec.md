# Histórico de Tarefas: sem as concluídas por padrão

- **Status:** implementada (2026-11-03), conferida na tela por Daniel
- **Pedido por:** Álvaro ("trazer só etapas não concluídas")
- **Branch:** `feat/rel-historico-nao-concluidas`
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `relatorios-historico.md` (a escrever)

## Contexto

O Histórico de Tarefas é usado para acompanhar o que está em andamento. As tarefas concluídas
ocupam a maior parte do relatório (em outubro, 321 das 354 tarefas com movimento).

## Critérios de aceite

- **CA-1.** Um filtro novo, **Situação**, com as opções **Não concluídas**, **Concluídas** e
  **Todas**. O relatório sempre abre em **Não concluídas**; a escolha não fica guardada.
- **CA-2.** Uma tarefa está concluída quando ela está **hoje** na etapa final, qualquer que seja o
  período consultado. Exemplo: uma tarefa concluída em outubro e reaberta em novembro aparece como
  não concluída também no relatório de outubro.
- **CA-3.** O filtro vale nas duas visões: na Agrupada some o bloco da tarefa; na Detalhada somem
  os eventos dela.
- **CA-4.** O filtro aparece no resumo de filtros das exportações (PDF e Excel) e no tour.
- **CA-5.** O total de tarefas mostrado no relatório respeita o filtro.

## Decisões

- **2026-11-03 (Daniel):** "concluída" é a situação de hoje, e não a do fim do período (CA-2).
- **2026-11-03:** sem resposta à pergunta de lembrar o filtro, vale a recomendação: não lembra.
