# Atendimento recorrente

- **Status:** aprovada (2026-10-30)
- **Pedido por:** Álvaro; desenho aprovado por Daniel em 2026-10-30, com recorrência semanal
- **Branch:** `feat/atendimento-recorrencia`
- **Versão:** 1.14.0
- **Specs de domínio afetadas:** `atendimentos.md` (a escrever)

## Contexto

Hoje, um atendimento que se repete (visita mensal, treinamento semanal) precisa ser lançado à mão
a cada vez.

## Comportamento esperado

No cadastro do atendimento, um campo **Recorrência**: Nenhuma, Semanal, Mensal ou Anual. Com
recorrência, a pessoa informa até quando ela vai, por quantidade de ocorrências ou por data
final, e como as próximas são geradas:

- **Gerar todas agora:** todas as ocorrências são criadas ao salvar.
- **Gerar a próxima ao concluir:** só existe a próxima. Quando ela é concluída, a seguinte é criada.

As ocorrências formam uma **série**. Ao editar ou excluir uma ocorrência de uma série, o sistema
pergunta: **só esta**, **esta e as próximas** ou **a série inteira**.

## Critérios de aceite

- **CA-1.** Dado um atendimento semanal na terça às 14h, com 4 ocorrências e "gerar todas agora",
  quando ele é salvo, então existem 4 atendimentos em terças seguidas às 14h, com o mesmo
  título, descrição, cliente, colaboradores e avisos.
- **CA-2.** Dado um mensal no dia 31, então nos meses sem dia 31 a ocorrência cai no último dia
  do mês, e no mês seguinte volta ao dia 31.
- **CA-3.** Dado um anual em 29/02, então nos anos não bissextos ele cai em 28/02.
- **CA-4.** Dado "gerar a próxima ao concluir", quando uma ocorrência é concluída, então a
  seguinte é criada na data **prevista** pela recorrência, e não a partir da data em que a
  conclusão aconteceu. Se a série já chegou ao fim, nada é criado.
- **CA-5.** Dado "gerar a próxima ao concluir", quando a conclusão é desfeita (o atendimento é
  reaberto), então a ocorrência seguinte que ainda não foi concluída é removida.
- **CA-6.** Editar "só esta" muda uma ocorrência. Editar "esta e as próximas" aplica a mudança a
  ela e a todas as seguintes **não concluídas**. Editar "a série inteira" aplica a todas as não
  concluídas. Ocorrências concluídas nunca são alteradas.
- **CA-7.** Excluir segue as mesmas três opções e também nunca apaga ocorrência concluída.
- **CA-8.** Na lista, no calendário e no detalhe, a ocorrência de uma série é identificada como tal
  (por exemplo, "3 de 4" ou "semanal até 15/12").
- **CA-9.** Atendimento sem recorrência funciona exatamente como hoje.
- **CA-10.** "Gerar todas agora" aceita no máximo 52 ocorrências. Acima disso, o cadastro recusa e
  sugere "gerar a próxima ao concluir", que não tem limite.
- **CA-11.** Cada ocorrência copia os avisos (notificações) configurados na primeira.

## Fora de escopo

- Recorrência diária, quinzenal ou "a cada N semanas".
- Transformar um atendimento já existente em recorrente. A recorrência só pode ser escolhida na criação.
- Mudar a recorrência de uma série existente (de semanal para mensal, por exemplo). Para mudar,
  exclui-se "esta e as próximas" e cria-se uma série nova.

## Decisões

- **2026-10-30 (Daniel):** limite de 52 ocorrências no "gerar todas agora" (CA-10); avisos
  copiados (CA-11); mudar a recorrência de uma série fica fora desta versão.
