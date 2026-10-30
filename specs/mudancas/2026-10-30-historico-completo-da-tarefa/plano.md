# Plano — Relatórios mostram a tarefa inteira

Spec: [spec.md](spec.md)

## Abordagem

O período (e os demais filtros) passa a escolher **quais tarefas** entram. Os eventos devolvidos
são todos os dessas tarefas até o fim do período. A montagem dos blocos e o crédito já funcionam
com o histórico inteiro (é o que acontece hoje quando se filtram dois meses), então o grosso da
correção está na consulta. O que muda no frontend é o recorte de "concluída no período" e a
separação entre a visão Agrupada e a Detalhada do Histórico.

### 1. Backend: parâmetro `historicoCompleto` no `relatorio-historico`

`GET /projetos/tarefas/relatorio-historico?historicoCompleto=true`

- Os filtros atuais (tipo, colaborador, projeto, cliente, etapa, período) continuam sendo
  aplicados, mas numa CTE `Selecionados (Id, TarefaId)` que só escolhe os eventos que casam.
- A consulta principal devolve **todos** os eventos das tarefas em `Selecionados` com
  `DataHoraAcao <= @DataFim`. Os eventos depois do fim ficam de fora (CA-4).
- Coluna nova `DentroDoFiltro` (bit): 1 quando o evento está em `Selecionados`. É o que a visão
  Detalhada usa para continuar mostrando só o período (CA-8) sem uma segunda requisição.
- Sem o parâmetro, a resposta é a mesma de hoje, com `DentroDoFiltro` sempre 1.
- `ultimaOcorrencia` e `historicoCompleto` juntos: vale `ultimaOcorrencia`, como hoje. Nenhuma
  tela usa os dois.
- `TarefaHistoricoRelatorioResponse` ganha `DentroDoFiltro`.

As colunas calculadas por evento (`ElaboracaoJaIniciadaNoEvento`, `ResponsavelReserva*`) e os
tempos já olham o histórico inteiro e não mudam.

### 2. Frontend: motor dos relatórios (`useItensAgrupados`)

- Opção nova `inicioPeriodo` (Date ou null).
- **`tarefasFinalizadas` (COM-03)** passa a ser calculado a partir dos eventos `E`, e não dos
  segmentos: a tarefa está concluída no período quando o **último** `E` dela vai para a etapa
  final **e** foi gravado a partir de `inicioPeriodo`. Isso cobre CA-3 (concluída em setembro,
  só uma reatribuição em outubro: o último `E` é de setembro) e CA-5 (reaberta e concluída de
  novo no mês: o último `E` é a reconclusão).
  - Hoje o critério sai dos segmentos, e o segmento da etapa final só existe se ela tiver
    responsável. Com os eventos, uma tarefa movida para a final **sem responsável** passa a ser
    reconhecida como concluída. O crédito dela continua vindo das etapas anteriores (COM-10 e
    COM-11). Ver "Riscos".

### 3. Frontend: Relatório de Comissão

- Passa `historicoCompleto: true` na busca e `inicioPeriodo` para o motor.
- `getHistoricoTarefas` repassa o parâmetro novo.

### 4. Frontend: Histórico de Tarefas

- Passa `historicoCompleto: true` na busca.
- **Agrupada:** usa todos os registros (CA-7). Sai o filtro que escondia a linha de Atendimento
  fora do período (`dentroDoPeriodo` em `gruposOrdenados`), por decisão da spec.
- **Detalhada:** filtra `dentroDoFiltro` antes de tudo (CA-8). O resto da visão não muda.
- O total de tarefas mostrado continua sendo o das tarefas selecionadas, que é o mesmo número
  com ou sem o histórico completo.

### 5. Dashboard: ranking de tarefas concluídas (CA-9)

A seleção das tarefas fica como está: entrada na etapa final dentro do período, uma vez por
tarefa (CA-10). Muda o crédito, que passa a seguir COM-10 e COM-11 com os eventos até `@Fim`:

1. o `ColaboradorId` do `E` mais recente cuja **etapa deixada** é a de elaboração (quem saiu da
   elaboração);
2. senão, o do `E` mais recente cuja etapa deixada não é nula (Atendimento) nem a final;
3. senão, o responsável da passagem pela etapa final: a última atribuição antes de `@Fim`;
4. senão, a tarefa sai do ranking (COM-05), como já acontece com o `INNER JOIN`.

"Etapa deixada" é o `LAG(EtapaId)` sobre os `E` da tarefa, o mesmo truque que o Kanban já usa
para `UltimoResponsavelElaboracaoId`. O trecho vai para `TarefaSql` como um fragmento
reutilizável, e o Kanban passa a usá-lo também, para as duas consultas não divergirem.

O comentário que diz que o critério é "o mesmo do Relatório de Comissão" passa a ser verdade, e
cita COM-10/COM-11.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Backend/API/Controllers/ProjetosController.cs` | Parâmetro `historicoCompleto` em `ObterRelatorioHistorico` |
| `Backend/API/DB/DAOs/ProjetosDAO.cs` | CTE `Selecionados`, coluna `DentroDoFiltro` em `ObterRelatorioHistoricoAsync`; Kanban usa o fragmento novo |
| `Backend/API/DTOs/Projetos/TarefaHistoricoRelatorioResponse.cs` | Propriedade `DentroDoFiltro` |
| `Backend/API/DB/DAOs/TarefaSql.cs` | Fragmento "etapa deixada" por evento `E` |
| `Backend/API/DB/DAOs/DashboardDAO.cs` | Crédito do ranking de tarefas concluídas |
| `Frontend/src/app/relatorios/projetos-historico/api/historicoTarefas.js` | Repassa `historicoCompleto` |
| `Frontend/src/app/relatorios/useItensAgrupados.js` | Opção `inicioPeriodo`; `tarefasFinalizadas` pelos eventos |
| `Frontend/src/app/relatorios/comissao/page.js` | Busca com histórico completo; passa `inicioPeriodo` |
| `Frontend/src/app/relatorios/projetos-historico/page.js` | Busca com histórico completo; Agrupada sem filtro da linha de Atendimento; Detalhada por `dentroDoFiltro` |
| `specs/dominio/comissao.md` | COM-02 e COM-03 reescritas; sai o "Problema conhecido" |

## Banco de dados

Sem alteração de esquema. A consulta nova filtra por `TarefaId` e `DataHoraAcao` em
`ProjetoTarefaHistorico`; vou conferir se existe índice em `(TarefaId, DataHoraAcao)` e, se não
houver, propor um `migration_*.sql` só com o índice.

## Riscos e pontos de atenção

- **Tarefa concluída sem responsável na etapa final** passa a entrar na Comissão (item 2). É o
  que COM-03 já diz, mas hoje não acontece. Antes de subir, rodo uma consulta que lista essas
  tarefas nos últimos meses, para você ver se o número muda e quanto.
- **Os totais de meses passados mudam** ao reabrir o relatório. É o objetivo da correção, mas
  quem comparar com um PDF antigo vai ver diferença.
- **Volume:** uma tarefa antiga com movimento no mês traz o histórico inteiro dela. No uso atual
  isso são dezenas de eventos por tarefa; não espero impacto perceptível.
- **Histórico de Projetos** (`historico-relatorio`) usa outra consulta e não é afetado.

## Como verificar

Ainda não há testes automatizados; a verificação é manual, contra a base de desenvolvimento com
uma cópia dos dados de produção.

- **CA-1, CA-2.** Comissão de outubro: tarefa 2494 com as seis linhas, aprovador Edmundo, sem a
  linha "Sem passagem pela elaboração"; no tipo "Teste", na seção do Edmundo.
- **CA-3, CA-4, CA-5.** Consultas SQL para achar um caso real de cada (concluída antes do mês com
  reatribuição no mês; concluída e reaberta depois; reaberta e reconcluída no mês). Onde não
  houver caso real, monto um na base de desenvolvimento.
- **CA-6.** Para três colaboradores, conferir que Detalhada e Resumo dão o mesmo número.
- **CA-7, CA-8.** Histórico de outubro: tarefa 2494 inteira na Agrupada; na Detalhada, só os
  eventos de 01/10.
- **CA-9.** Dashboard de outubro: ranking igual ao Resumo da Comissão de outubro, tipo "Tarefas".
- **CA-10.** Card "Concluídas no período" com o mesmo número de antes da mudança.
- Build do backend e do frontend sem erro (o que o CI roda).

## Verificação feita (2026-10-30)

Contra a base de desenvolvimento (cópia de produção), outubro de 2026, chamando o próprio
`ProjetosDAO` e o próprio `useItensAgrupados` (antes e depois da mudança):

- **Consulta:** as mesmas 354 tarefas com e sem histórico completo; os 3.074 eventos marcados
  `DentroDoFiltro` são exatamente os que a consulta antiga devolvia (CA-8), mais 178 eventos
  anteriores ao período; nenhum evento depois do fim (CA-4). O mesmo vale com filtro de tipo.
- **CA-1, CA-2:** tarefa 2494 com Atendimento › Reservado › Elaboração › Aprovação › Atualização ›
  Concluído, desenvolvedor Yuri pela Elaboração, aprovador Edmundo.
- **Efeito na Comissão de outubro:** tipo Tarefas de 313 para 320 tarefas (7 com crédito novo,
  nenhuma saiu); tipo Teste de 116 para 125 (Edmundo 29 → 34, Estefany 16 → 18, Marcio 50 → 52).
  As tarefas novas são as que só tinham, em outubro, a entrada na etapa final: antes elas não
  formavam nenhuma passagem e sumiam do relatório.
- **CA-9:** ranking do Dashboard e Resumo da Comissão (tipo Tarefas) com o mesmo total para todos
  os 14 colaboradores (320 tarefas). Pelo crédito antigo do Dashboard, só 1 das 321 tarefas
  concluídas mudava de dono.
- **Risco "final sem responsável":** 1 tarefa em agosto, 3 em setembro e 1 em outubro.
- Builds do backend e do frontend sem erro.

**Conferência na tela:** feita por Daniel em 2026-10-30. (CA-3, CA-5, CA-6, CA-7 e CA-10 não foram
exercitados com casos reais montados.)
