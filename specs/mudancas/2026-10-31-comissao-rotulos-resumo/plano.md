# Plano — Comissão: Elaboração, Aprovação e horas no Resumo

Spec: [spec.md](spec.md)

## Abordagem

Só frontend. Os valores internos do filtro (`tarefa`, `teste`) ficam como estão; mudam os
rótulos. As horas saem dos tempos realizados que cada item já carrega, mais a duração agendada
do atendimento, que passa a ser calculada no motor dos relatórios.

## Rótulos (`relatorios/comissao/page.js`)

- Seletor Tipo: "Tarefas" vira **Elaboração** e "Teste" vira **Aprovação** (CA-1).
- "Totalizar por": Elaboração / **Aprovação**.
- `rotuloTotalResumo`: "Total (elaboração)", "Total (aprovação)", "Total (atendimentos
  concluídos)", "Total (elaboração + atendimentos)".
- `tipoLabel` do resumo de filtros das exportações e o texto do tour com os nomes novos (CA-2).

## Horas no Resumo

- `useItensAgrupados`: cada atendimento ganha `duracaoAgendadaMin`, a diferença em minutos entre
  o início e o fim marcados (0 sem fim). O atendimento já vem completo em `atendimentosTodos`.
- `resumoColaboradores` passa a somar, junto do total de itens, `minutos`:
  - crédito por elaboração: `execucaoRealizadaMin` da tarefa ou `duracaoAgendadaMin` do atendimento;
  - crédito por aprovação: `testeRealizadoMin` da tarefa.
  Os mesmos itens que entram na contagem entram na soma (CA-5).
- Tabela do Resumo: coluna **Horas**, formatada com `formatarMinutos` (já usado nos itens), e uma
  linha final "Total" com a soma das duas colunas (CA-3).
- PDF e Excel do Resumo: a coluna e a linha de total entram nos dois.

## Spec de domínio

`dominio/comissao.md`: glossário e COM-15/COM-16 com os nomes novos; COM-20 passa a dizer que o
Resumo mostra a quantidade e as horas realizadas; regra nova para a duração agendada do
atendimento.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Frontend/src/app/relatorios/comissao/page.js` | Rótulos, coluna e total de horas |
| `Frontend/src/app/relatorios/useItensAgrupados.js` | `duracaoAgendadaMin` do atendimento |
| `specs/dominio/comissao.md` | Rótulos e regra das horas |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- Tarefas antigas sem cronômetro têm tempo realizado zero; o total de horas pode parecer baixo
  em meses antigos. É o dado que existe.
- O tempo realizado soma o histórico inteiro da tarefa (COM-09), não só o do período. Fica
  explicado no tour, porque o total do mês pode incluir horas de meses anteriores.

## Como verificar

- **CA-1, CA-2:** rótulos na tela, no PDF, no Excel e no tour.
- **CA-3 a CA-5:** na base de desenvolvimento, outubro, conferir as horas de dois colaboradores
  somando à mão os tempos dos itens da visão Detalhada, nos quatro tipos.
- Build do frontend.
