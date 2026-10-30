# Ajustes da 1.14.0

- **Status:** aprovada (2026-10-30)
- **Pedido por:** Álvaro e Daniel; plano aprovado por Daniel em 2026-10-30
- **Branches:** uma por item, indicada em cada seção
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `dominio/comissao.md` (COM-18 sai)

Mudanças pequenas e independentes, numa spec só. Cada seção vira uma branch.

## A. Nome do cliente no Dashboard — `fix/dashboard-nome-cliente`

O Dashboard mostra sempre a razão social, ignorando a configuração "Exibição do nome do cliente".

- **CA-A1.** Com a configuração em "Nome fantasia", todas as listas dos indicadores do Dashboard
  mostram o nome fantasia. Cliente sem nome fantasia mostra a razão social.
- **CA-A2.** Com a configuração em "Razão social", nada muda.

## B. Nome do cliente ao arrastar no Kanban — `fix/kanban-arrastar-nome-cliente`

Durante o arrasto, o cartão troca para a razão social.

- **CA-B1.** O cartão mostra o mesmo nome de cliente antes, durante e depois do arrasto.

## C. Lembrar modo cartão/lista — `feat/lembrar-modo-visualizacao`

- **CA-C1.** Em Projetos, Clientes, Colaboradores, Setores, Cargos, Etapas e Prioridades, a tela
  abre no último modo (cartões ou lista) que a pessoa escolheu nela, neste navegador.
- **CA-C2.** Cada tela lembra o seu modo, independentemente das outras.
- **CA-C3.** Na primeira vez, ou se o navegador não guardar a preferência, abre em cartões, como hoje.

## D. Lembrar o setor no lançamento de tarefas — `feat/lembrar-setor-tarefa`

- **CA-D1.** Ao lançar uma tarefa, o setor vem preenchido com o último setor que a pessoa usou
  num lançamento, neste navegador.
- **CA-D2.** Sem setor guardado, ou se o setor guardado foi inativado, vem o setor do usuário,
  como hoje.

## E. Data de nascimento do cliente opcional — `fix/cliente-data-nascimento-opcional`

- **CA-E1.** É possível salvar um cliente sem data de nascimento, na criação e na edição.
- **CA-E2.** Se a data for informada, a validação de data continua valendo.
- **CA-E3.** O tour de ajuda da tela não diz mais que o campo é obrigatório.
- **CA-E4.** Se o banco não aceitar o campo vazio, a mudança traz o script de alteração para rodar
  à mão e a atualização do `schema.sql`.

## F. Comissão sem o filtro "Aprovado por" — `feat/comissao-sem-aprovado-por`

- **CA-F1.** O filtro "Aprovado por" sai da tela, das exportações e do resumo de filtros impresso.
- **CA-F2.** O "Aprovado por: <nome>" continua no cabeçalho de cada item, e o tipo "Teste"
  continua funcionando (COM-14, COM-15).
- **CA-F3.** Ao concluir, a regra COM-18 sai de `dominio/comissao.md`. As regras seguintes mantêm
  os números: ID de regra não é reaproveitado.

## G. Excluir tarefa que já entrou no fluxo — `fix/excluir-tarefa-com-historico`

O fix existia e saiu da `main` pelo commit de revert `901c58f` (2026-09-28). Ele não se perdeu:
volta com `git revert 901c58f`. Mergear a branch antiga não traz o código de volta.

- **CA-G1.** Excluir do projeto uma tarefa que já passou por alguma etapa funciona, ou é recusado
  com uma mensagem que explica o motivo. Nunca com o erro genérico.
- **CA-G2.** Antes de reverter, reviso o código que volta para confirmar que ainda bate com a
  `main` atual (1.13.0).

## Fora de escopo

Itens que dependem de mais detalhes seus: cronômetro flutuante, lentidão, bug visual, gráfico de
tarefas no Dashboard, registro na etapa pulada (1→3), negrito e ordem da folha impressa.
