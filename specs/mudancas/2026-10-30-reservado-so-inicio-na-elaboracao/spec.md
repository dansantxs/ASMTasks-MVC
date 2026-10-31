# Reservado: só o início na elaboração conta

- **Status:** rascunho
- **Pedido por:** Daniel, 2026-10-30 (resposta à pergunta aberta de `etapas-e-fluxo.md`)
- **Branch:** `fix/reservado-so-inicio-na-elaboracao` (depois de `feat/flag-etapa-elaboracao`)
- **Versão:**
- **Specs de domínio afetadas:** `dominio/etapas-e-fluxo.md` (ETP-09); `dominio/comissao.md` (COM-08)

## Contexto

Hoje, qualquer início (`I`) no histórico faz a tarefa contar como "elaboração iniciada", mesmo que
tenha sido iniciada em outra etapa (análise, por exemplo). Uma tarefa assim chega à elaboração e
nunca aparece como Reservada, embora ninguém tenha começado a elaborá-la. Daniel confirmou que
isso não é o desejado.

O início continua sendo permitido em qualquer etapa (ETP-11), porque o cronômetro mede também o
tempo de teste. Muda só o que conta para o Reservado.

## Comportamento esperado

A tarefa está Reservada quando está na etapa de elaboração e nunca foi iniciada **na etapa de
elaboração**. Inícios em outras etapas não contam.

## Critérios de aceite

- **CA-1.** Dada uma tarefa iniciada na Análise e depois movida para a Elaboração sem ser
  iniciada de novo, então ela aparece como Reservada no Kanban, no Dashboard e nos relatórios.
- **CA-2.** Quando ela é iniciada na Elaboração, então deixa de ser Reservada, e os relatórios
  mostram a linha Reservado do período entre a entrada na Elaboração e esse início (COM-08).
- **CA-3.** Dada uma tarefa que já foi iniciada na Elaboração, foi para o teste e voltou, então ela
  não volta a ser Reservada, como hoje (ETP-09).
- **CA-4.** A etapa do início é a que foi gravada no evento, e não a etapa atual da tarefa. O
  critério vale para eventos antigos sem nenhuma migração de dados.
- **CA-5.** O tempo de execução e o de teste (COM-09) não mudam.

## Fora de escopo

- Impedir o início fora da elaboração.

## Perguntas em aberto

Nenhuma.
