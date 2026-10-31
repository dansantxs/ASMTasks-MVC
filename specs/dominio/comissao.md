# Relatório de Comissão

- **Prefixo das regras:** `COM`
- **Tela:** Relatórios › Comissão
- **Última revisão:** 2026-10-30, versão 1.13.0
- **Origem:** `RelOrcaTempoDesenv.frm` do sistema antigo (SisAlwaysNFe), reformulado na 1.9.0;
  crédito por teste na 1.12.0.

## Propósito

Base de cálculo da comissão do mês. Lista as tarefas e os atendimentos **concluídos** no período
e diz quem recebe o crédito de cada um: quem desenvolveu (padrão) ou quem testou (tipo "Teste").
O relatório não calcula valores, só conta itens por colaborador.

## Glossário

| Termo | Significado |
|---|---|
| **Item** | Uma tarefa ou um atendimento. Cada item vira um bloco com as passagens por etapa. |
| **Passagem** | Período em que a tarefa ficou numa etapa com um responsável. |
| **Etapa final** | A etapa marcada com "Etapa Final" no cadastro de Etapas. |
| **Etapa de teste** | Etapa marcada com "Etapa de Teste" no cadastro de Etapas. |
| **Etapa de elaboração** | Etapa cujo **nome** contém "desenvolv" ou "elabora" (sem diferenciar maiúsculas). Não há flag no cadastro. |
| **Desenvolvedor** | Quem recebe o crédito por elaboração (COM-10 a COM-13). |
| **Aprovador** | Quem fez a última passagem pela etapa de teste (COM-14). |

## Regras

### Período e o que entra no relatório

- **COM-01. Período padrão.** O relatório abre com o último mês completo: do dia 1 ao último dia
  do mês anterior ao atual. *Por quê:* logo depois da virada, o que interessa é o mês que fechou.
- **COM-02. Recorte por período.** O período (início 00:00:00, fim 23:59:59) e o filtro de
  cliente escolhem as **tarefas**: as que têm algum evento no período. Cada uma vem com o
  histórico inteiro até o fim do período, inclusive o que aconteceu antes do início. Eventos
  depois do fim são ignorados. Colaborador e tipo **não** restringem a busca: o
  crédito depende de todas as reatribuições da tarefa, inclusive as de outras pessoas.
  *Por quê:* a tarefa que atravessa a virada do mês chegava pela metade, sem a elaboração ou o
  teste do mês anterior, e o crédito saía errado (corrigido na
  [historico-completo-da-tarefa](../mudancas/2026-10-30-historico-completo-da-tarefa/spec.md)).
- **COM-03. Tarefa concluída.** Uma tarefa entra quando a última mudança de etapa dela até o fim
  do período leva à etapa final **e** aconteceu dentro do período. Ela conta só no mês em que
  entrou na final: uma reatribuição no mês seguinte não a traz de volta. Reaberta e concluída de
  novo no mesmo período, conta uma vez. Reaberta depois do fim do período, continua contando.
  Vale também quando a etapa final ficou sem responsável.
- **COM-04. Atendimento concluído.** Um atendimento entra quando tem um evento de conclusão
  (marcado como Realizado) no período **e** continua Realizado hoje. Se foi reaberto depois, não
  entra. Se foi concluído mais de uma vez no período, conta uma vez só.
- **COM-05. Item sem crédito fica de fora.** O item em que ninguém pode ser creditado (nenhuma
  passagem com responsável, ou, no tipo "Teste", nenhuma passagem pela etapa de teste) não
  aparece. *Por quê:* o relatório é de comissão, e é falha de cadastro da tarefa, não do relatório.

### Montagem de cada item

- **COM-06. Uma linha por etapa.** Se a tarefa passou várias vezes pela mesma etapa, aparece só
  a passagem mais recente.
- **COM-07. Linha "Atendimento".** A primeira linha de todo item mostra quem lançou a demanda e
  quando (colaborador e data de cadastro da tarefa ou do atendimento). Não é uma etapa cadastrada.
- **COM-08. Linha "Reservado".** Quando a tarefa entrou na elaboração e ficou parada antes do
  primeiro início, esse intervalo aparece como uma linha "Reservado", e a linha da elaboração
  passa a contar a partir do início. Reinícios depois de pausa não geram nova linha.
- **COM-09. Tempos.** O tempo previsto vem do cadastro da tarefa. O tempo realizado (execução e
  teste) soma **todo** o histórico da tarefa, inclusive o que aconteceu antes do período.
  Atendimento não tem tempos.

### Crédito por elaboração (padrão)

- **COM-10. Tarefa: quem elaborou.** O desenvolvedor é o responsável pela última passagem por uma
  etapa de elaboração que tenha responsável.
- **COM-11. Tarefa que não passou pela elaboração.** Se não há passagem pela elaboração, o crédito
  vai, nesta ordem, para:
  1. o responsável pela passagem mais recente que **não** seja a etapa final;
  2. o responsável pela passagem mais recente, mesmo que seja a final;
  3. ninguém, e o item sai do relatório (COM-05).

  Nesse caso o item ganha uma linha de elaboração com a observação
  "Sem passagem pela elaboração — creditado pela etapa X", posicionada antes da etapa final.
  *Por quê:* parte das tarefas é resolvida direto em análise ou atualização. Sem essa regra elas
  sumiam da contagem, embora o histórico mostre quem fez.
- **COM-12. Atendimento: quem concluiu.** O desenvolvedor é quem concluiu o atendimento. Sem
  esse registro, o crédito vai para quem disparou o evento de conclusão e, por último, para o
  primeiro colaborador atribuído ao atendimento.
- **COM-13. Participar não dá crédito.** Ter lançado, testado ou feito outra etapa do item não
  dá crédito por elaboração.

### Crédito por teste

- **COM-14. Aprovador.** O aprovador de uma tarefa é o responsável pela última passagem por uma
  etapa de teste. Atendimento não tem aprovador.
- **COM-15. Tipo "Teste".** "Teste" não é um tipo de item: são as mesmas tarefas concluídas, com o
  crédito indo para o aprovador em vez do desenvolvedor. Atendimentos não entram. Tarefa sem
  aprovador fica de fora.

### Filtros

- **COM-16. Tipo.** Todos, Tarefas, Atendimentos ou Teste (ver COM-15).
- **COM-17. Colaborador.** Escolhe os itens pelo **crédito de elaboração**, não pela participação:
  entram as tarefas que a pessoa elaborou e os atendimentos que ela concluiu. Dentro de cada item,
  as passagens das outras pessoas continuam visíveis. No tipo "Teste", o filtro continua
  escolhendo as tarefas pela elaboração, mas as seções e o total saem por quem testou.
- **COM-18.** *Removida na 1.14.0.* Era o filtro "Aprovado por", que saiu a pedido do Álvaro.
  O aprovador continua aparecendo no cabeçalho de cada item (COM-14).

### Visões

- **COM-19. Detalhada.** Itens agrupados em seções por quem recebe o crédito, em ordem
  alfabética. Dentro da seção, os itens são numerados a partir de 1 e ordenados por Cliente ou
  por Data de conclusão (a mais recente das passagens), crescente ou decrescente; a chave não
  escolhida serve de desempate.
- **COM-20. Resumo.** Quantidade de itens por colaborador, do maior total para o menor (empate
  por nome). Pode totalizar por elaboração ou por teste; por teste, só contam tarefas. Detalhada
  e Resumo sempre mostram o mesmo número para o mesmo colaborador com os mesmos filtros.

## Dependências do cadastro

O relatório depende do cadastro de Etapas, e duas dessas dependências são pelo **nome**:

| Depende de | Como é reconhecido | Se mudar |
|---|---|---|
| Etapa final | flag "Etapa Final" | Sem etapa final cadastrada, o recorte de COM-03 deixa de existir e entram todas as tarefas com movimento no período, sem aviso. Decidido em 2026-10-30 que continua assim. |
| Etapa de teste | flag "Etapa de Teste" | Seguro contra renomeação. |
| Etapa de elaboração | nome contém "desenvolv" ou "elabora" | Renomear para algo sem esses trechos faz todo crédito cair no COM-11 e as linhas "Reservado" sumirem. Nenhum erro aparece. |

## Problemas conhecidos

- **Elaboração reconhecida pelo nome.** Será trocada por flag no cadastro (decidido em
  2026-10-30): [flag-etapa-elaboracao](../mudancas/2026-10-30-flag-etapa-elaboracao/spec.md).

## Perguntas em aberto

Nenhuma.

## Onde está no código

- Tela, filtros e visões: `Frontend/src/app/relatorios/comissao/page.js`
- Montagem dos itens e crédito (compartilhado com os relatórios de histórico):
  `Frontend/src/app/relatorios/useItensAgrupados.js`
- Busca dos eventos: `GET /projetos/tarefas/relatorio-historico?historicoCompleto=true` →
  `ProjetosDAO.ObterRelatorioHistoricoAsync`; atendimentos em `AtendimentosDAO`.
- A mesma regra de crédito em SQL, para o ranking do Dashboard: `TarefaSql.CreditoElaboracao`.
  Mudou a regra num lado, mude no outro.
