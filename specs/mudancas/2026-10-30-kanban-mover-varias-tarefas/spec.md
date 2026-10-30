# Kanban: mover várias tarefas de uma vez

- **Status:** aprovada (2026-10-30)
- **Pedido por:** Daniel, 2026-10-30
- **Branch:** `feat/kanban-mover-varias-tarefas`
- **Versão:**
- **Specs de domínio afetadas:** `dominio/etapas-e-fluxo.md` (ETP-03 a ETP-07)

## Contexto

Mandar várias tarefas para o teste, devolver para a elaboração, puxar do Atendimento para a
elaboração ou concluir um lote exige arrastar uma por uma, respondendo o diálogo de mover a cada vez.

## Comportamento esperado

A pessoa seleciona várias tarefas no quadro e arrasta qualquer uma delas: todas vão juntas para a
coluna de destino, com um único diálogo de mover.

## Critérios de aceite

### Seleção

- **CA-1.** Ctrl+clique (Cmd+clique no Mac) num cartão marca ou desmarca a tarefa. Uma caixinha
  no canto do cartão, que aparece ao passar o mouse (e fica visível enquanto ele estiver
  marcado), faz o mesmo. Cartões marcados ficam visualmente destacados, e uma barra mostra
  "N tarefas selecionadas", com a opção de limpar a seleção.
- **CA-2.** Clique simples, sem Ctrl, continua abrindo a tarefa, como hoje.
- **CA-3.** Esc limpa a seleção. Mudar os filtros do quadro também limpa.
- **CA-4.** A seleção pode ter tarefas de colunas diferentes.

### Arrastar

- **CA-5.** Arrastar uma tarefa selecionada move todas as selecionadas. Durante o arrasto, o
  cartão mostra quantas tarefas estão indo (por exemplo, um selo "+3").
- **CA-6.** Arrastar uma tarefa não selecionada move só ela, como hoje, e não mexe na seleção.
- **CA-7.** Tarefas que já estão na coluna de destino são ignoradas.

### Diálogo de mover

- **CA-8.** Um diálogo só, com a lista das tarefas e um responsável para todas.
- **CA-9.** O responsável sugerido segue ETP-06. Se a regra der o mesmo nome para todas as
  tarefas, ele vem preenchido; se der nomes diferentes, o campo vem com "Manter o sugerido de
  cada tarefa", que aplica a regra de ETP-06 tarefa por tarefa.
- **CA-10.** Indo para o teste, a lista de responsáveis só tem o setor de teste (ETP-07). Indo
  para Atendimento, o responsável é removido de todas (ETP-04).

### Regras e erros

- **CA-11.** Cada tarefa obedece às mesmas regras de quando é movida sozinha: permissão
  (ETP-03), histórico gravado (ETP-05) e conclusão automática do projeto (ETP-13).
- **CA-12.** Se alguma tarefa não puder ser movida (por exemplo, por não ser sua e você não ser
  administrador), as outras são movidas mesmo assim, e o sistema mostra quais ficaram para trás
  e por quê.
- **CA-13.** Tarefa em andamento (cronômetro aberto) é tratada como quando é movida sozinha: a
  elaboração é encerrada (ETP-05).

## Fora de escopo

- Selecionar com arrasto de área (laço) ou com Shift+clique para intervalos.
- Seleção em massa por checkbox no modo lista.
- Ações em lote que não sejam mover (trocar só o responsável, excluir).

## Decisões

- **2026-10-30 (Daniel):** se alguma tarefa não puder ser movida, as outras seguem (CA-12).
- **2026-10-30 (Daniel):** seleção por Ctrl+clique e por caixinha no cartão (CA-1).
