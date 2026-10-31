# Comissão: Elaboração e Aprovação, e horas no Resumo

- **Status:** rascunho
- **Pedido por:** Álvaro; Daniel em 2026-10-31
- **Branch:** `feat/comissao-rotulos-resumo` (depois de `feat/comissao-sem-aprovado-por`, já na `main`)
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `dominio/comissao.md` (glossário, COM-15, COM-16, COM-20)

## Contexto

Os nomes "Tarefas" e "Teste" do seletor de tipo não batem com o vocabulário da equipe, que fala
em elaboração e aprovação. E o Resumo só conta itens: para a comissão, falta o total de horas.

## Critérios de aceite

### Rótulos

- **CA-1.** O seletor **Tipo** passa a ter: Todos, **Elaboração** (antes "Tarefas"),
  Atendimentos e **Aprovação** (antes "Teste"). O comportamento de cada opção não muda.
- **CA-2.** Os nomes novos aparecem também no seletor "Totalizar por" do Resumo, no rótulo da
  coluna de total, no resumo de filtros das exportações e no tour.

### Horas no Resumo

- **CA-3.** O Resumo ganha a coluna **Horas** ao lado do total de itens, em **todos** os tipos,
  na tela, no PDF e no Excel, com uma linha de total geral.
- **CA-4.** As horas de cada colaborador somam o tempo **realizado** dos itens creditados a ele,
  no formato já usado nos itens (ex.: "12h 30min"), com o previsto entre parênteses:
  - **Elaboração:** tempo de execução das tarefas que ele elaborou;
  - **Aprovação:** tempo de teste das tarefas que ele aprovou;
  - **Atendimentos:** ver pergunta 1;
  - **Todos:** elaboração mais atendimentos, como a contagem de itens.
- **CA-5.** O total de horas respeita os mesmos filtros da contagem de itens, e Detalhada e
  Resumo continuam batendo (COM-20).

## Perguntas em aberto

1. **Horas de atendimento.** O atendimento não tem cronômetro. O que conta: a duração agendada
   (do início ao fim marcados), ou o atendimento entra no Resumo sem horas?
   *Recomendação:* a duração agendada, quando o atendimento tem horário de fim; sem fim, zero.
2. **Previsto entre parênteses** no Resumo, ou só o realizado? *Recomendação:* os dois, no mesmo
   formato dos itens, para dar para comparar.
