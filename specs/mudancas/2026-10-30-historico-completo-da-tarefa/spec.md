# Relatórios mostram a tarefa inteira, não só o pedaço dentro do período

- **Status:** rascunho
- **Pedido por:** Daniel, 2026-10-30
- **Branch:** `fix/historico-completo-da-tarefa`
- **Versão:**
- **Specs de domínio afetadas:** `dominio/comissao.md` (COM-02, COM-03, COM-10, COM-11, COM-14);
  `relatorios-historico.md` (a escrever)

## Contexto

Os relatórios de Comissão e de Histórico de Tarefas (visão Agrupada) só recebem os eventos que
aconteceram **dentro** do período filtrado. Uma tarefa que começou num mês e terminou no outro
chega pela metade, e o relatório monta o bloco e calcula o crédito só com essa metade.

Caso real, tarefa 355 (Granja Indaiá, "Vendas de ovos — impressão romaneio"):

| Data | Colaborador | Etapa |
|---|---|---|
| 29/09 08:11 | Marcio Aparecido Joanili | Atendimento |
| 29/09 10:25 | Yuri Junior Saito | Reservado |
| 29/09 12:36 | Yuri Junior Saito | Elaboração |
| 29/09 15:26 | Edmundo de Souza Ribeiro | Aprovação (teste) |
| 01/10 07:23 | Yuri Junior Saito | Atualização |
| 01/10 13:52 | Yuri Junior Saito | Concluído |

- **Filtrando setembro e outubro:** o bloco sai certo (todas as linhas acima, "Aprovado por:
  Edmundo").
- **Filtrando só outubro:** somem o Atendimento, o Reservado, a Elaboração e a Aprovação. O
  relatório inventa uma linha "Elaboração — Sem passagem pela elaboração, creditado pela etapa
  Atualização" e o item fica sem aprovador.

O efeito na comissão:

- **Crédito de teste perdido.** No tipo "Teste" de outubro, a tarefa não aparece porque não tem
  aprovador. Em setembro também não aparece, porque ainda não estava concluída. O teste do
  Edmundo não é pago em mês nenhum.
- **Crédito de elaboração por acaso.** Neste caso o Yuri recebeu o crédito certo porque ele
  também fez a Atualização. Se outra pessoa tivesse feito a etapa anterior à final, o crédito
  iria para ela.

## Comportamento esperado

Num relatório filtrado por período, o período decide **quais tarefas entram**. A partir daí,
cada tarefa é mostrada com o histórico inteiro até o fim do período, inclusive o que aconteceu
antes do início.

## Critérios de aceite

### Comissão

- **CA-1.** Dada a tarefa 355, quando o relatório de Comissão é filtrado só por outubro, então
  ela aparece com as seis linhas da tabela acima, "Aprovado por: Edmundo", e o crédito de
  elaboração do Yuri vem da etapa Elaboração, sem a linha "Sem passagem pela elaboração".
- **CA-2.** Dada a mesma tarefa, quando o tipo é "Teste" e o período é outubro, então ela entra
  na seção do Edmundo.
- **CA-3.** Dada uma tarefa concluída em setembro que teve só uma troca de responsável em
  outubro, sem sair da etapa final, quando o período é outubro, então ela **não** entra. Uma
  tarefa só conta no mês em que entrou na etapa final.
- **CA-4.** Dada uma tarefa concluída em outubro e reaberta em novembro, quando o período é
  outubro, então ela entra. Eventos depois do fim do período não aparecem e não mudam nada.
- **CA-5.** Dada uma tarefa concluída em outubro, reaberta e concluída de novo também em
  outubro, então ela conta uma vez.
- **CA-6.** O Resumo e a visão Detalhada continuam dando o mesmo total por colaborador (COM-20).

### Histórico de Tarefas

- **CA-7.** Na visão Agrupada, uma tarefa com qualquer movimento no período aparece com o
  histórico inteiro até o fim do período, como em CA-1.
- **CA-8.** A visão Detalhada (log de eventos) continua mostrando só os eventos dentro do
  período.

### Dashboard

- **CA-9.** O ranking de tarefas concluídas no período credita a mesma pessoa que o Relatório de
  Comissão (COM-10 e COM-11) e soma o mesmo total por colaborador. Hoje ele credita quem estava
  na etapa anterior à final: no fluxo normal, quem testou. O comentário no código afirma que o
  critério é o mesmo da Comissão, mas não é.
- **CA-10.** O card "Concluídas no período" não muda: ele já conta pela entrada na etapa final
  dentro do período.

## Fora de escopo

- Relatório de Histórico de Atendimentos: atendimento não tem etapas, e o crédito vem do próprio
  cadastro do atendimento.
- Tempos de execução e teste: já somam o histórico inteiro (COM-09).
- Recalcular comissões de meses já fechados. Se algum mês foi pago com o relatório errado, a
  conferência é manual.

## Perguntas em aberto

1. **CA-7.** Na visão Agrupada do Histórico, mostrar o histórico inteiro é o desejado? A
   alternativa é manter só o período e marcar o bloco como "começou antes do período".
   *Recomendação:* histórico inteiro, igual à Comissão.
2. **CA-9.** Alinhar o Dashboard entra nesta mudança ou fica numa mudança própria?
   *Recomendação:* nesta. É o mesmo erro de fundo, e você suspeitou dos gráficos.
