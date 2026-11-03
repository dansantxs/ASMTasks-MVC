# Plano — Dashboard: atendimentos por dia da semana

Spec: [spec.md](spec.md)

## Abordagem

Um gráfico de sete colunas, de segunda a domingo, na seção de Atendimentos do Dashboard. Ele
reaproveita o gráfico de tendência mensal que já existe (`GraficoTendencia` e
`ColunaTendencia`), que já mostra a lista ao passar o mouse e fixa ao clicar. Muda só o eixo:
dias da semana em vez de meses.

## Backend

- `DashboardAtendimentosDTO` ganha `PorDiaSemana: List<DiaSemanaDTO>`, sempre com 7 itens
  (CA-1), cada um com `Dia` (1 = segunda … 7 = domingo), `Label` ("Seg"…"Dom"), `Total` e
  `Itens` (até `@Limite`, no formato das outras listas).
- Em `DashboardDAO.ObterAtendimentosAsync`, uma consulta nova:
  - atendimentos com **data marcada** (`DataHoraInicio`) em `[@Inicio, @Fim)`, concluídos ou não
    (CA-5);
  - o filtro de colaborador de sempre (`FiltroColaboradorAtendimento`) quando o Dashboard está
    filtrado (CA-4);
  - dia da semana por `DATEDIFF(DAY, '19000101', a.DataHoraInicio) % 7` (0 = segunda), que **não
    depende** do `SET DATEFIRST` nem do idioma do servidor, diferente de `DATEPART(WEEKDAY)`;
  - contagem por dia com `COUNT(*) OVER (PARTITION BY dia)` e a lista com `ROW_NUMBER()`, no
    mesmo padrão do ranking de colaboradores;
  - nome do cliente pela configuração, com `MapearLinha` (CA-4).
- Os dias sem atendimento são completados em C# com total zero.

## Frontend

- `GraficoTendencia` recebe os rótulos e os itens por parâmetro em vez de assumir meses; a
  tendência mensal passa a usá-lo do mesmo jeito.
- Card novo "Atendimentos por dia da semana", ao lado da tendência mensal. A coluna (ou colunas,
  em empate) com o maior total fica com a cor de destaque (CA-2); as outras, com a cor neutra.
- Título com o período do Dashboard, como os outros cards: "Por dia da semana (Outubro)".

## Arquivos afetados

| Arquivo | O que muda |
|---|---|
| `Backend/API/DTOs/DashboardDTO.cs` | `DiaSemanaDTO` e `PorDiaSemana` |
| `Backend/API/DB/DAOs/DashboardDAO.cs` | Consulta por dia da semana |
| `Frontend/src/app/dashboard/page.js` | Gráfico genérico e card novo |

## Banco de dados

Sem alteração.

## Riscos e pontos de atenção

- O Dashboard já faz várias consultas por carga. A nova lê só `Atendimento`, filtrada pelo
  período, e é do mesmo porte da de "Realizados no período".
- Com um período de um dia ("Hoje"), o gráfico fica com seis colunas zeradas. É correto, mas
  pouco útil: o card mostra a dica "Escolha um período maior para comparar os dias".

## Como verificar

- **CA-1, CA-2:** na base de desenvolvimento, outubro, conferir os sete totais contra um
  `GROUP BY` escrito à mão; criar um empate para ver os dois destaques.
- **CA-3:** lista ao passar o mouse e fixada ao clicar.
- **CA-4:** filtro de colaborador e configuração do nome do cliente.
- **CA-5:** um atendimento marcado na terça e concluído na quinta conta na terça.
- Builds do backend e do frontend.
