# Plano — Histórico de Tarefas sem as concluídas por padrão

Spec: [spec.md](spec.md)

## Abordagem

A situação que vale é a de **hoje** (CA-2), e não a reconstruída pelo histórico. Então o
backend informa, em cada registro, se a tarefa está agora na etapa final, e o filtro é aplicado
no navegador sobre as tarefas já carregadas. Isso mantém a consulta de hoje, inclusive o
histórico completo da tarefa, e deixa a troca de "Situação" instantânea, sem nova busca.

## Backend

- `ProjetosDAO.ObterRelatorioHistoricoAsync`: coluna nova
  `CASE WHEN EXISTS (SELECT 1 FROM Etapa ef WHERE ef.Id = pt.EtapaId AND ef.EhEtapaFinal = 1)
  THEN 1 ELSE 0 END AS TarefaConcluida`, nas três montagens da consulta (normal, histórico
  completo e última ocorrência).
- `TarefaHistoricoRelatorioResponse` ganha `TarefaConcluida`.

## Frontend (`relatorios/projetos-historico/page.js`)

- Estado `situacaoFilter` com `useState('naoConcluidas')`. Não usa `usePreferenciaLocal`, para
  sempre abrir em "Não concluídas" (decisão da spec).
- Seletor **Situação** junto dos outros filtros: Não concluídas, Concluídas, Todas (CA-1).
- O recorte é aplicado nos registros **antes** de irem para a visão Detalhada e para o
  `useItensAgrupados`, então as duas visões e o total de tarefas respeitam o filtro (CA-3, CA-5).
- Resumo de filtros do PDF e do Excel: "Situação: Não concluídas" (CA-4). Tour: uma frase sobre
  o filtro e o padrão.

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Backend/API/DB/DAOs/ProjetosDAO.cs` | Coluna `TarefaConcluida` |
| `Backend/API/DTOs/Projetos/TarefaHistoricoRelatorioResponse.cs` | Propriedade `TarefaConcluida` |
| `Frontend/src/app/relatorios/projetos-historico/page.js` | Filtro Situação |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- A Comissão usa a mesma consulta e ignora a coluna nova; o critério dela continua sendo COM-03.
- Uma tarefa concluída em outubro e reaberta em novembro aparece como não concluída também no
  relatório de outubro. É o comportamento decidido (CA-2), e vai para o tour para não surpreender.

## Como verificar

- **CA-1:** o relatório abre em "Não concluídas"; trocar para "Todas" traz o mesmo número de
  tarefas de antes da mudança.
- **CA-2:** na base de desenvolvimento, achar uma tarefa reaberta depois de concluída e conferir
  a classificação.
- **CA-3 a CA-5:** as duas visões, o total e as exportações com cada opção.
- Builds do backend e do frontend.
