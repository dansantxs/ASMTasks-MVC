# Linha do tempo da tarefa em frases

- **Status:** aprovada (2026-11-03)
- **Pedido por:** Daniel, 2026-11-03 ("frequentemente pedem para eu explicar")
- **Branch:** `feat/linha-do-tempo-legivel`
- **Versão:**
- **Specs de domínio afetadas:** `dominio/etapas-e-fluxo.md` (glossário dos eventos)

## Contexto

O histórico no detalhe da tarefa mostra cada evento gravado como uma linha solta: "Movida para
etapa", "Responsável atribuído", "Elaboração iniciada". Uma única ação de quem usa o sistema
(arrastar a tarefa e escolher o responsável) vira duas ou três linhas, e não fica claro quem fez,
o que fez e para quem.

Exemplo real (do mais recente para o mais antigo), como aparece hoje:

```
Movida para etapa      → Aprovação · por Daniel dos Santos        30/10 10:49
Responsável atribuído  Sem responsável                            30/10 10:49
Elaboração pausada     Daniel dos Santos                          29/10 15:54
Elaboração iniciada    Daniel dos Santos                          29/10 15:08
Movida para etapa      → Elaboração · por Daniel dos Santos       29/10 15:08
Responsável atribuído  Daniel dos Santos                          29/10 15:08
Movida para etapa      → Aprovação · por Elizabeth A. S. Matsuda  29/10 15:04
Responsável atribuído  Elizabeth A. S. Matsuda                    29/10 15:04
Movida para etapa      → Elaboração · por João Carlos Viana Déo   29/10 14:12
Responsável atribuído  Daniel dos Santos                          29/10 14:12
```

O mesmo histórico, como passaria a aparecer:

```
30/10 10:49  Daniel dos Santos moveu de Elaboração para Aprovação, sem responsável
29/10 15:54  Daniel dos Santos pausou o trabalho na Elaboração
29/10 15:08  Daniel dos Santos começou a trabalhar na Elaboração
29/10 15:08  Daniel dos Santos moveu de Aprovação para Elaboração e assumiu a tarefa
29/10 15:04  Elizabeth A. S. Matsuda moveu de Elaboração para Aprovação e assumiu a tarefa
29/10 14:12  João Carlos Viana Déo moveu de Atendimento para Elaboração e passou para Daniel dos Santos
```

## Critérios de aceite

- **CA-1.** Cada ação vira **uma frase**, que começa por quem fez: "<quem> <fez o quê>". A mudança
  de etapa e a troca de responsável gravadas no mesmo instante, pela mesma pessoa, são uma ação só.
- **CA-2.** A mudança de etapa diz **de onde para onde**: "moveu de Elaboração para Aprovação".
  A primeira saída do Atendimento diz "de Atendimento".
- **CA-3.** O responsável da ação aparece no fim da frase:
  - outra pessoa: "e passou para <nome>";
  - a própria pessoa: "e assumiu a tarefa";
  - ninguém: ", sem responsável";
  - sem troca de responsável: nada.
- **CA-4.** Troca de responsável sem mudança de etapa: "<quem> passou a tarefa para <nome>",
  "<quem> assumiu a tarefa" ou "<quem> tirou o responsável".
- **CA-5.** Cronômetro: "<quem> começou a trabalhar na <etapa>" e "<quem> pausou o trabalho na
  <etapa>", com a observação da pausa entre aspas quando houver. O encerramento automático do
  cronômetro ao mudar de etapa não vira linha própria: a frase da mudança termina com "(trabalho
  encerrado)".
- **CA-6.** A cor da etiqueta continua indicando o tipo da ação (mover, responsável, cronômetro,
  projeto), para a leitura rápida.
- **CA-7.** Nada do histórico é escondido: toda informação que aparece hoje continua aparecendo,
  agrupada.
- **CA-8.** Eventos antigos, gravados antes desta mudança, também aparecem em frases.

- **CA-9.** A ordem continua do mais recente para o mais antigo.

## Fora de escopo

- A visão Detalhada do Histórico de Tarefas, que é o mesmo log em tabela, usada para conferência.

## Decisões

- **2026-11-03:** sem resposta às perguntas da ordem e do relatório, valem as recomendações
  (CA-9; relatório fora de escopo).
