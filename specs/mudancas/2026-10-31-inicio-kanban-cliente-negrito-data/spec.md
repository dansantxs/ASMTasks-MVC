# Início e Kanban: cliente em negrito, data visível e ordem escolhida

- **Status:** implementada (2026-11-03), aguardando conferência na tela
- **Pedido por:** Álvaro (folha impressa de pedidos)
- **Branch:** `feat/inicio-kanban-cliente-negrito-data`
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `dominio/etapas-e-fluxo.md` (Kanban); `dashboard.md` (a escrever)

## Contexto

"Início" é o Dashboard (a raiz do sistema leva para ele). O pedido é ler mais rápido de quem é
cada item e de quando ele é, nas listas do Início e nos cartões do Kanban.

## Critérios de aceite

### Cliente em negrito

- **CA-1.** No Kanban, o nome do cliente aparece em negrito no cartão, na coluna e durante o
  arrasto.
- **CA-2.** No Início, o nome do cliente aparece em negrito em todas as listas que o mostram
  (indicadores, Próximos atendimentos, Projetos sem movimentação).
- **CA-3.** O nome do cliente continua seguindo a configuração (razão social ou nome fantasia).

### Data no Início

- **CA-4.** Cada tarefa das listas do Início mostra uma linha "Lançado em dd/mm/aa", com a data
  de lançamento da tarefa, além da "Última ação" que já aparece.

### Ordem no Início

- **CA-5.** As listas do Início ganham um seletor de ordem com duas opções:
  - **Etapa e colaborador**: a ordem de hoje, pedida na 1.11. É o padrão;
  - **Mais recentes primeiro**: pela data de lançamento, da mais recente para a mais antiga, com
    etapa e colaborador como desempate.
- **CA-6.** A escolha fica guardada no navegador de quem usa, e o Início volta na mesma ordem na
  próxima visita. Sem nada guardado, vale "Etapa e colaborador".
- **CA-7.** A ordem vale para todas as listas de tarefas do Início ao mesmo tempo, inclusive na
  lista que abre ao passar o mouse num indicador.

### Ordem no Kanban

- **CA-8.** O Kanban abre ordenado por **Lançamento, do mais recente para o mais antigo**. Quem já
  escolheu outra ordenação continua com a sua (ela já fica guardada no navegador).

## Decisões

- **2026-11-03 (Daniel):** no Início, em vez de trocar a ordem, um seletor; o padrão continua
  etapa e colaborador, e a escolha fica lembrada (CA-5, CA-6).
- **2026-11-03:** sem resposta às perguntas da data (CA-4) e da ordem já escolhida no Kanban
  (CA-8), valem as recomendações.
