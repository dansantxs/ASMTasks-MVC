# Dashboard: atendimentos por dia da semana

- **Status:** aprovada (2026-10-30)
- **Pedido por:** Álvaro
- **Branch:** `feat/dashboard-dia-semana-atendimentos` (mergear depois de `fix/dashboard-nome-cliente`)
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `dashboard.md` (a escrever)

## Comportamento esperado

Um indicador novo no Dashboard com a quantidade de atendimentos por dia da semana, no período
selecionado, destacando o dia com mais atendimentos.

## Critérios de aceite

- **CA-1.** O indicador mostra os sete dias, de segunda a domingo, com a quantidade de cada um,
  inclusive os que têm zero.
- **CA-2.** O dia com mais atendimentos aparece destacado. Em caso de empate, todos os empatados
  ficam destacados.
- **CA-3.** Passando o mouse sobre um dia, aparece a lista dos atendimentos daquele dia, como
  nos outros indicadores.
- **CA-4.** O indicador respeita o período e o filtro de colaborador do Dashboard, e o nome do
  cliente segue a configuração.
- **CA-5.** O atendimento conta no dia da semana da sua data **marcada** (início), esteja ele
  concluído ou não. Exemplo: marcado para terça e concluído na quinta conta na terça.

## Decisões

- **2026-10-30 (Daniel):** conta a data marcada, porque mostra a demanda de cada dia (CA-5).
