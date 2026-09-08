using API.DTOs.Dashboard;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    /// <summary>
    /// Consultas do dashboard.
    ///
    /// Duas regras valem para o arquivo inteiro:
    ///
    /// 1. Indicador "do período" nunca usa MONTH()/YEAR() de GETDATE() — usa a janela
    ///    [@Inicio, @Fim) resolvida em <see cref="ResolverPeriodo"/>. Antes, todo indicador
    ///    "deste mês" caía para perto de zero no dia 1º e ainda impedia o uso de índice.
    ///
    /// 2. O número do card e a lista que ele abre saem da MESMA consulta: a lista é limitada
    ///    por TOP (@Limite) e o total vem de COUNT(*) OVER (), calculado antes do TOP. Assim
    ///    os dois não têm como divergir, e a tela sabe quando está mostrando só uma parte.
    /// </summary>
    public class DashboardDAO
    {
        // Colunas de uma linha de tarefa nas listas. Inclui o status atual (mesmo CASE do Kanban,
        // em ProjetosDAO.ObterTarefasKanbanAsync) e quem mexeu por último, e quando.
        private const string ColunasTarefa = @"
                    t.Id,
                    t.Titulo,
                    pr.Titulo AS ProjetoTitulo,
                    cli.Nome AS ClienteNome,
                    cli.NomeFantasia AS ClienteNomeFantasia,
                    col.Nome AS ColaboradorNome,
                    e.Nome AS EtapaNome,
                    CASE
                        WHEN t.DataHoraInicio IS NOT NULL THEN 'Em andamento'
                        WHEN EXISTS (
                            SELECT 1 FROM ProjetoTarefaHistorico h
                            WHERE h.TarefaId = t.Id AND h.Tipo = 'P'
                              AND h.DataHoraAcao > COALESCE(
                                  (SELECT MAX(h2.DataHoraAcao) FROM ProjetoTarefaHistorico h2
                                   WHERE h2.TarefaId = t.Id AND h2.Tipo = 'E'),
                                  '1900-01-01')
                        ) THEN 'Pausada'
                        ELSE 'Ociosa'
                    END AS StatusAtual,
                    t.DataHoraAtribuicao AS DesdeQuando,
                    ult.UltimaAcaoPor,
                    ult.UltimaAcaoEm";

        private const string DeTarefa = @"
                FROM ProjetoTarefa t
                INNER JOIN Projeto pr ON pr.Id = t.ProjetoId
                INNER JOIN Cliente cli ON cli.Id = pr.ClienteId
                LEFT JOIN Colaborador col ON col.Id = t.ColaboradorResponsavelId
                LEFT JOIN Etapa e ON e.Id = t.EtapaId
                OUTER APPLY (
                    SELECT TOP 1
                        COALESCE(h.RealizadoPorColaboradorNome, h.ColaboradorNome) AS UltimaAcaoPor,
                        h.DataHoraAcao AS UltimaAcaoEm
                    FROM ProjetoTarefaHistorico h
                    WHERE h.TarefaId = t.Id
                    ORDER BY h.DataHoraAcao DESC, h.Id DESC
                ) ult";

        private const string ProjetoAtivo = " AND pr.Ativo = 1 AND pr.Concluido = 0";

        private const string ColunasAtendimento = @"
                    a.Id,
                    a.Titulo,
                    CAST(NULL AS nvarchar(200)) AS ProjetoTitulo,
                    c.Nome AS ClienteNome,
                    c.NomeFantasia AS ClienteNomeFantasia,
                    resp.Nomes AS ColaboradorNome,
                    CAST(NULL AS nvarchar(200)) AS EtapaNome,
                    CASE a.Status WHEN 'R' THEN 'Realizado' WHEN 'A' THEN 'Agendado' ELSE 'Cancelado' END AS StatusAtual,
                    a.DataHoraInicio AS DesdeQuando,
                    conc.Nome AS UltimaAcaoPor,
                    a.DataHoraConclusao AS UltimaAcaoEm";

        private const string DeAtendimento = @"
                FROM Atendimento a
                INNER JOIN Cliente c ON c.Id = a.ClienteId
                LEFT JOIN Colaborador conc ON conc.Id = a.ConcluidoPorColaboradorId
                OUTER APPLY (
                    SELECT STRING_AGG(colA.Nome, ', ') AS Nomes
                    FROM AtendimentoColaborador ac2
                    INNER JOIN Colaborador colA ON colA.Id = ac2.ColaboradorId
                    WHERE ac2.AtendimentoId = a.Id
                ) resp";

        // Colaborador do atendimento via EXISTS (e não INNER JOIN): a relação é N:N e o join
        // duplicaria a linha — e, com COUNT(*) OVER (), duplicaria também o total.
        private const string FiltroColaboradorAtendimento =
            " AND EXISTS (SELECT 1 FROM AtendimentoColaborador ac WHERE ac.AtendimentoId = a.Id AND ac.ColaboradorId = @ColaboradorId)";

        private const string ColunasProjeto = @"
                    p.Id,
                    p.Titulo,
                    CAST(NULL AS nvarchar(200)) AS ProjetoTitulo,
                    c.Nome AS ClienteNome,
                    c.NomeFantasia AS ClienteNomeFantasia,
                    cad.Nome AS ColaboradorNome,
                    CAST(NULL AS nvarchar(200)) AS EtapaNome,
                    CASE WHEN p.Concluido = 1 THEN 'Concluído' WHEN p.Ativo = 0 THEN 'Inativo' ELSE 'Ativo' END AS StatusAtual,
                    p.DataCadastro AS DesdeQuando";

        private const string DeProjeto = @"
                FROM Projeto p
                INNER JOIN Cliente c ON c.Id = p.ClienteId
                LEFT JOIN Colaborador cad ON cad.Id = p.CadastradoPorColaboradorId
                LEFT JOIN Colaborador alt ON alt.Id = p.AlteradoPorColaboradorId";

        private const string TotalGeral = ",\n                    COUNT(*) OVER () AS TotalGeral";

        public async Task<DashboardDTO> ObterDashboardAsync(
            DBContext dbContext,
            int colaboradorIdLogado,
            bool ehAdministrador,
            int? filtroColaboradorId,
            string? periodoId = null,
            string exibicaoNomeCliente = "razaoSocial")
        {
            await using var con = await dbContext.GetConnectionAsync();

            bool filtrarPorColaborador = !ehAdministrador || filtroColaboradorId.HasValue;
            int idParaFiltro = (ehAdministrador && filtroColaboradorId.HasValue)
                ? filtroColaboradorId.Value
                : colaboradorIdLogado;
            bool usarNomeFantasia = exibicaoNomeCliente == "nomeFantasia";
            var periodo = ResolverPeriodo(periodoId);

            var resultado = new DashboardDTO { EhAdministrador = ehAdministrador, Periodo = periodo };

            resultado.Atendimentos = await ObterAtendimentosAsync(con, idParaFiltro, filtrarPorColaborador, usarNomeFantasia, periodo);
            resultado.Tarefas = await ObterTarefasAsync(con, idParaFiltro, filtrarPorColaborador, ehAdministrador && !filtroColaboradorId.HasValue, usarNomeFantasia, periodo);

            if (ehAdministrador)
            {
                resultado.Projetos = await ObterProjetosAsync(con, usarNomeFantasia, periodo);
                resultado.Colaboradores = await ObterColaboradoresAsync(con, periodo);
                resultado.ProjetosSemMovimentacao = await ObterProjetosSemMovimentacaoAsync(con);
                resultado.ColaboradoresDisponiveis = await ObterColaboradoresDisponiveisAsync(con);

                if (filtroColaboradorId.HasValue)
                {
                    resultado.Filtro = new DashboardFiltroDTO
                    {
                        ColaboradorId = filtroColaboradorId.Value,
                        ColaboradorNome = resultado.ColaboradoresDisponiveis
                            .FirstOrDefault(c => c.Id == filtroColaboradorId.Value)?.Nome ?? ""
                    };
                }
            }

            return resultado;
        }

        /// <summary>
        /// Janela dos indicadores de período. Fim é exclusivo, então nenhum registro do último
        /// dia se perde por causa da hora.
        /// </summary>
        private static DashboardPeriodoDTO ResolverPeriodo(string? periodoId)
        {
            var hoje = DateTime.Today;
            var primeiroDoMes = new DateTime(hoje.Year, hoje.Month, 1);

            return periodoId switch
            {
                "mesAnterior" => new DashboardPeriodoDTO
                {
                    Id = "mesAnterior",
                    Label = "Mês anterior",
                    Inicio = primeiroDoMes.AddMonths(-1),
                    Fim = primeiroDoMes
                },
                "ultimos30" => new DashboardPeriodoDTO
                {
                    Id = "ultimos30",
                    Label = "Últimos 30 dias",
                    Inicio = hoje.AddDays(-29),
                    Fim = hoje.AddDays(1)
                },
                _ => new DashboardPeriodoDTO
                {
                    Id = "mesAtual",
                    Label = "Mês atual",
                    Inicio = primeiroDoMes,
                    Fim = primeiroDoMes.AddMonths(1)
                }
            };
        }

        // --- Leitura das listas -------------------------------------------------------------

        private static string? Texto(SqlDataReader reader, string coluna)
        {
            var valor = reader[coluna];
            return valor == DBNull.Value ? null : Convert.ToString(valor);
        }

        private static DateTime? Data(SqlDataReader reader, string coluna)
        {
            var valor = reader[coluna];
            return valor == DBNull.Value ? null : Convert.ToDateTime(valor);
        }

        private static DashboardLinhaDTO MapearLinha(SqlDataReader reader, bool usarNomeFantasia)
        {
            var fantasia = Texto(reader, "ClienteNomeFantasia");
            return new DashboardLinhaDTO
            {
                Id = Convert.ToInt32(reader["Id"]),
                Titulo = Texto(reader, "Titulo") ?? "",
                ProjetoTitulo = Texto(reader, "ProjetoTitulo"),
                ClienteNome = usarNomeFantasia && !string.IsNullOrWhiteSpace(fantasia)
                    ? fantasia
                    : Texto(reader, "ClienteNome"),
                ColaboradorNome = Texto(reader, "ColaboradorNome"),
                EtapaNome = Texto(reader, "EtapaNome"),
                StatusAtual = Texto(reader, "StatusAtual"),
                DesdeQuando = Data(reader, "DesdeQuando"),
                UltimaAcaoPor = Texto(reader, "UltimaAcaoPor"),
                UltimaAcaoEm = Data(reader, "UltimaAcaoEm")
            };
        }

        private static async Task<DashboardIndicadorDTO> LerIndicadorAsync(SqlCommand cmd, string sql, bool usarNomeFantasia)
        {
            cmd.CommandText = sql;
            var indicador = new DashboardIndicadorDTO();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                if (indicador.Itens.Count == 0)
                    indicador.Total = Convert.ToInt32(reader["TotalGeral"]);
                indicador.Itens.Add(MapearLinha(reader, usarNomeFantasia));
            }
            return indicador;
        }

        /// <summary>
        /// Deixa @ColaboradorId, @Inicio, @Fim e @Limite prontos no comando. Os valores não mudam
        /// entre as consultas de uma seção, então só o CommandText é trocado. Parâmetro declarado
        /// e não usado é aceito pelo SQL Server.
        /// </summary>
        private static void PrepararParametros(SqlCommand cmd, int colaboradorId, DashboardPeriodoDTO periodo)
        {
            cmd.Parameters.Clear();
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@Inicio", periodo.Inicio);
            cmd.Parameters.AddWithValue("@Fim", periodo.Fim);
            cmd.Parameters.AddWithValue("@Limite", DashboardIndicadorDTO.LimitePadrao);
        }

        // --- Atendimentos -------------------------------------------------------------------

        private async Task<DashboardAtendimentosDTO> ObterAtendimentosAsync(
            SqlConnection con, int colaboradorId, bool filtrarPorColaborador, bool usarNomeFantasia,
            DashboardPeriodoDTO periodo)
        {
            var dto = new DashboardAtendimentosDTO();
            await using var cmd = con.CreateCommand();
            PrepararParametros(cmd, colaboradorId, periodo);

            var filtro = filtrarPorColaborador ? FiltroColaboradorAtendimento : "";

            dto.Hoje = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'A'
                  AND a.DataHoraInicio >= CAST(GETDATE() AS DATE)
                  AND a.DataHoraInicio < DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
                  {filtro}
                ORDER BY a.DataHoraInicio
            ", usarNomeFantasia);

            // Pendentes do PERÍODO (antes era todo Status='A' da história inteira, um número
            // grande e sem leitura possível).
            dto.PendentesPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'A'
                  AND a.DataHoraInicio >= @Inicio AND a.DataHoraInicio < @Fim
                  {filtro}
                ORDER BY a.DataHoraInicio
            ", usarNomeFantasia);

            dto.EmAtraso = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'A'
                  AND a.DataHoraFim IS NOT NULL AND a.DataHoraFim < GETDATE()
                  {filtro}
                ORDER BY a.DataHoraFim
            ", usarNomeFantasia);

            dto.RealizadosPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'R'
                  AND a.DataHoraConclusao >= @Inicio AND a.DataHoraConclusao < @Fim
                  {filtro}
                ORDER BY a.DataHoraConclusao DESC
            ", usarNomeFantasia);

            // Tendência: ancorada em hoje (últimos 6 meses), independente do período escolhido —
            // é a série histórica, não um recorte.
            var hoje = DateTime.Today;
            var inicioTendencia = new DateTime(hoje.Year, hoje.Month, 1).AddMonths(-5);
            cmd.Parameters.AddWithValue("@InicioTendencia", inicioTendencia);
            cmd.CommandText = $@"
                SELECT YEAR(a.DataHoraConclusao), MONTH(a.DataHoraConclusao), COUNT(DISTINCT a.Id)
                FROM Atendimento a
                WHERE a.Status = 'R'
                  AND a.DataHoraConclusao >= @InicioTendencia
                  {filtro}
                GROUP BY YEAR(a.DataHoraConclusao), MONTH(a.DataHoraConclusao)
                ORDER BY 1, 2
            ";

            var tendenciaBruta = new Dictionary<(int, int), int>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                    tendenciaBruta[(reader.GetInt32(0), reader.GetInt32(1))] = reader.GetInt32(2);
            }

            var cultura = new System.Globalization.CultureInfo("pt-BR");
            for (int i = 5; i >= 0; i--)
            {
                var mesRef = hoje.AddMonths(-i);
                dto.Tendencia.Add(new TendenciaMensalDTO
                {
                    Ano = mesRef.Year,
                    Mes = mesRef.Month,
                    Total = tendenciaBruta.TryGetValue((mesRef.Year, mesRef.Month), out var v) ? v : 0,
                    Label = new DateTime(mesRef.Year, mesRef.Month, 1).ToString("MMM/yy", cultura)
                });
            }

            cmd.CommandText = $@"
                SELECT TOP 5 a.Id, a.Titulo, c.Nome, a.DataHoraInicio
                FROM Atendimento a
                INNER JOIN Cliente c ON c.Id = a.ClienteId
                WHERE a.Status = 'A'
                  AND a.DataHoraInicio >= GETDATE()
                  {filtro}
                ORDER BY a.DataHoraInicio ASC
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.Proximos.Add(new ProximoAtendimentoDTO
                    {
                        Id = reader.GetInt32(0),
                        Titulo = reader.GetString(1),
                        ClienteNome = reader.GetString(2),
                        DataHoraInicio = reader.GetDateTime(3)
                    });
                }
            }

            return dto;
        }

        // --- Tarefas ------------------------------------------------------------------------

        private async Task<DashboardTarefasDTO> ObterTarefasAsync(
            SqlConnection con, int colaboradorId, bool filtrarPorColaborador, bool incluirSemResponsavel,
            bool usarNomeFantasia, DashboardPeriodoDTO periodo)
        {
            var dto = new DashboardTarefasDTO();
            await using var cmd = con.CreateCommand();
            PrepararParametros(cmd, colaboradorId, periodo);

            var filtro = filtrarPorColaborador ? " AND t.ColaboradorResponsavelId = @ColaboradorId" : "";

            // Em andamento = tem etapa e não é a final. Antes contava TODAS as tarefas de projetos
            // ativos (backlog e concluídas junto) e ainda servia de denominador das barras "Por
            // Etapa", o que deixava os percentuais errados.
            dto.EmAndamento = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                WHERE t.EtapaId IS NOT NULL AND e.EhEtapaFinal = 0
                  {ProjetoAtivo}{filtro}
                ORDER BY t.Titulo
            ", usarNomeFantasia);

            dto.Backlog = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                WHERE t.EtapaId IS NULL
                  {ProjetoAtivo}{filtro}
                ORDER BY t.Titulo
            ", usarNomeFantasia);

            if (incluirSemResponsavel)
            {
                dto.SemResponsavel = await LerIndicadorAsync(cmd, $@"
                    SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                    {DeTarefa}
                    WHERE t.ColaboradorResponsavelId IS NULL
                      {ProjetoAtivo}
                    ORDER BY t.Titulo
                ", usarNomeFantasia);
            }

            // Ociosas: em etapa (não final) e nunca iniciadas — sem histórico de início nem pausa.
            dto.Ociosas = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                WHERE t.EtapaId IS NOT NULL AND e.EhEtapaFinal = 0
                  AND t.DataHoraInicio IS NULL
                  AND NOT EXISTS (SELECT 1 FROM ProjetoTarefaHistorico h WHERE h.TarefaId = t.Id AND h.Tipo IN ('I', 'P'))
                  {ProjetoAtivo}{filtro}
                ORDER BY t.Titulo
            ", usarNomeFantasia);

            // Concluídas no período: entrou na etapa final dentro da janela. DISTINCT por tarefa —
            // reabrir e reconcluir não conta duas vezes. Sem filtro de projeto ativo de propósito:
            // o projeto da tarefa concluída pode já ter sido fechado.
            dto.ConcluidasPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                INNER JOIN (
                    SELECT DISTINCT h.TarefaId
                    FROM ProjetoTarefaHistorico h
                    INNER JOIN Etapa ef ON ef.Id = h.EtapaId AND ef.EhEtapaFinal = 1
                    WHERE h.Tipo = 'E' AND h.DataHoraAcao >= @Inicio AND h.DataHoraAcao < @Fim
                ) concluidas ON concluidas.TarefaId = t.Id
                WHERE 1 = 1{filtro}
                ORDER BY t.Titulo
            ", usarNomeFantasia);

            // Em atraso na execução: minutos somados de elaboração (pares 'I' → próximo evento,
            // mais o cronômetro aberto) acima do tempo previsto da tarefa.
            dto.ExecucaoEmAtraso = await LerIndicadorAsync(cmd, $@"
                WITH ExecHistory AS (
                    SELECT h.TarefaId, h.DataHoraAcao, h.Tipo,
                           LEAD(h.DataHoraAcao) OVER (PARTITION BY h.TarefaId ORDER BY h.DataHoraAcao) AS NextTs
                    FROM ProjetoTarefaHistorico h
                    WHERE h.Tipo IN ('I', 'P')
                ),
                ExecMin AS (
                    SELECT TarefaId, SUM(DATEDIFF(MINUTE, DataHoraAcao, NextTs)) AS MinExec
                    FROM ExecHistory WHERE Tipo = 'I' AND NextTs IS NOT NULL
                    GROUP BY TarefaId
                ),
                Atrasadas AS (
                    SELECT tx.Id
                    FROM ProjetoTarefa tx
                    INNER JOIN Projeto prx ON prx.Id = tx.ProjetoId AND prx.Ativo = 1 AND prx.Concluido = 0
                    LEFT JOIN ExecMin em ON em.TarefaId = tx.Id
                    WHERE tx.TempoExecucaoValor IS NOT NULL
                      AND COALESCE(em.MinExec, 0)
                          + CASE WHEN tx.DataHoraInicio IS NOT NULL THEN DATEDIFF(MINUTE, tx.DataHoraInicio, GETDATE()) ELSE 0 END
                          > CASE tx.TempoExecucaoUnidade
                                WHEN 'D' THEN tx.TempoExecucaoValor * 1440
                                WHEN 'H' THEN tx.TempoExecucaoValor * 60
                                ELSE tx.TempoExecucaoValor
                            END
                )
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                INNER JOIN Atrasadas atr ON atr.Id = t.Id
                WHERE 1 = 1{filtro}
                ORDER BY t.Titulo
            ", usarNomeFantasia);

            // Em atraso no teste: só os minutos de elaboração que caem dentro de uma passagem
            // pela etapa marcada como Etapa de Teste.
            dto.TesteEmAtraso = await LerIndicadorAsync(cmd, $@"
                WITH StageIntervals AS (
                    SELECT h.TarefaId, h.DataHoraAcao AS StageStart,
                           LEAD(h.DataHoraAcao) OVER (PARTITION BY h.TarefaId ORDER BY h.DataHoraAcao) AS StageEnd
                    FROM ProjetoTarefaHistorico h
                    INNER JOIN Etapa et ON et.Id = h.EtapaId AND et.EhEtapaTeste = 1
                    WHERE h.Tipo = 'E'
                ),
                ExecHistory AS (
                    SELECT h.TarefaId, h.DataHoraAcao, h.Tipo,
                           LEAD(h.DataHoraAcao) OVER (PARTITION BY h.TarefaId ORDER BY h.DataHoraAcao) AS NextTs
                    FROM ProjetoTarefaHistorico h
                    WHERE h.Tipo IN ('I', 'P')
                ),
                ExecIntervals AS (
                    SELECT TarefaId, DataHoraAcao AS ExecStart, NextTs AS ExecEnd
                    FROM ExecHistory WHERE Tipo = 'I' AND NextTs IS NOT NULL
                ),
                TestMin AS (
                    SELECT si.TarefaId,
                           SUM(DATEDIFF(MINUTE,
                               CASE WHEN ei.ExecStart > si.StageStart THEN ei.ExecStart ELSE si.StageStart END,
                               CASE WHEN ei.ExecEnd < COALESCE(si.StageEnd, GETDATE()) THEN ei.ExecEnd ELSE COALESCE(si.StageEnd, GETDATE()) END
                           )) AS MinTeste
                    FROM StageIntervals si
                    INNER JOIN ExecIntervals ei ON ei.TarefaId = si.TarefaId
                        AND ei.ExecStart < COALESCE(si.StageEnd, GETDATE())
                        AND ei.ExecEnd > si.StageStart
                    GROUP BY si.TarefaId
                ),
                Atrasadas AS (
                    SELECT tx.Id
                    FROM ProjetoTarefa tx
                    INNER JOIN Projeto prx ON prx.Id = tx.ProjetoId AND prx.Ativo = 1 AND prx.Concluido = 0
                    LEFT JOIN TestMin tm ON tm.TarefaId = tx.Id
                    WHERE tx.TempoTesteValor IS NOT NULL
                      AND COALESCE(tm.MinTeste, 0)
                          > CASE tx.TempoTesteUnidade
                                WHEN 'D' THEN tx.TempoTesteValor * 1440
                                WHEN 'H' THEN tx.TempoTesteValor * 60
                                ELSE tx.TempoTesteValor
                            END
                )
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                INNER JOIN Atrasadas atr ON atr.Id = t.Id
                WHERE 1 = 1{filtro}
                ORDER BY t.Titulo
            ", usarNomeFantasia);

            // Por etapa, com a lista de cada faixa: uma consulta só, com o total por etapa
            // (COUNT OVER PARTITION) e a lista cortada por etapa (ROW_NUMBER).
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT{ColunasTarefa},
                        t.EtapaId AS EtapaIdFaixa,
                        e.Ordem AS EtapaOrdem,
                        e.EhEtapaFinal AS EtapaFinal,
                        COUNT(*) OVER (PARTITION BY t.EtapaId) AS TotalGeral,
                        ROW_NUMBER() OVER (PARTITION BY t.EtapaId ORDER BY t.Titulo) AS Posicao
                    {DeTarefa}
                    WHERE t.EtapaId IS NOT NULL
                      {ProjetoAtivo}{filtro}
                ) faixas
                WHERE faixas.Posicao <= @Limite
                ORDER BY faixas.EtapaOrdem, faixas.Titulo
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var etapaId = Convert.ToInt32(reader["EtapaIdFaixa"]);
                    var faixa = dto.PorEtapa.FirstOrDefault(f => f.EtapaId == etapaId);
                    if (faixa == null)
                    {
                        faixa = new TarefaPorEtapaDTO
                        {
                            EtapaId = etapaId,
                            Etapa = Texto(reader, "EtapaNome") ?? "",
                            Ordem = Convert.ToInt32(reader["EtapaOrdem"]),
                            EhEtapaFinal = Convert.ToBoolean(reader["EtapaFinal"]),
                            Total = Convert.ToInt32(reader["TotalGeral"])
                        };
                        dto.PorEtapa.Add(faixa);
                    }
                    faixa.Itens.Add(MapearLinha(reader, usarNomeFantasia));
                }
            }

            // Backlog entra como a primeira faixa, reaproveitando o indicador já lido.
            if (dto.Backlog.Total > 0)
            {
                dto.PorEtapa.Insert(0, new TarefaPorEtapaDTO
                {
                    EtapaId = null,
                    Etapa = "Backlog",
                    Ordem = -1,
                    EhEtapaFinal = false,
                    Total = dto.Backlog.Total,
                    Itens = dto.Backlog.Itens
                });
            }

            // Por prioridade, com a lista de cada faixa. Mesmo universo das barras por etapa (tudo
            // que não está na etapa final), pra que os dois gráficos somem o mesmo total.
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT{ColunasTarefa},
                        p.Nome AS PrioridadeNome,
                        p.Cor AS PrioridadeCor,
                        p.Ordem AS PrioridadeOrdem,
                        COUNT(*) OVER (PARTITION BY p.Id) AS TotalGeral,
                        ROW_NUMBER() OVER (PARTITION BY p.Id ORDER BY t.Titulo) AS Posicao
                    {DeTarefa}
                    INNER JOIN Prioridade p ON p.Id = t.PrioridadeId
                    WHERE COALESCE(e.EhEtapaFinal, 0) = 0
                      {ProjetoAtivo}{filtro}
                ) faixas
                WHERE faixas.Posicao <= @Limite
                ORDER BY faixas.PrioridadeOrdem, faixas.Titulo
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var nome = Texto(reader, "PrioridadeNome") ?? "";
                    var faixa = dto.PorPrioridade.FirstOrDefault(f => f.Prioridade == nome);
                    if (faixa == null)
                    {
                        faixa = new TarefaPorPrioridadeDTO
                        {
                            Prioridade = nome,
                            Cor = Texto(reader, "PrioridadeCor") ?? "",
                            Ordem = Convert.ToInt32(reader["PrioridadeOrdem"]),
                            Total = Convert.ToInt32(reader["TotalGeral"])
                        };
                        dto.PorPrioridade.Add(faixa);
                    }
                    faixa.Itens.Add(MapearLinha(reader, usarNomeFantasia));
                }
            }

            // Carga por colaborador, também com a lista. Foto do momento (não é métrica de
            // período — por isso saiu do ranking, que é sempre "no período").
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT{ColunasTarefa},
                        col.Id AS CargaColaboradorId,
                        COUNT(*) OVER (PARTITION BY col.Id) AS TotalGeral,
                        ROW_NUMBER() OVER (PARTITION BY col.Id ORDER BY t.Titulo) AS Posicao
                    {DeTarefa}
                    WHERE t.ColaboradorResponsavelId IS NOT NULL
                      AND COALESCE(e.EhEtapaFinal, 0) = 0
                      {ProjetoAtivo}
                ) faixas
                WHERE faixas.Posicao <= @Limite
                ORDER BY faixas.TotalGeral DESC, faixas.ColaboradorNome, faixas.Titulo
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var id = Convert.ToInt32(reader["CargaColaboradorId"]);
                    var faixa = dto.CargaPorColaborador.FirstOrDefault(f => f.Id == id);
                    if (faixa == null)
                    {
                        faixa = new CargaColaboradorDTO
                        {
                            Id = id,
                            Nome = Texto(reader, "ColaboradorNome") ?? "",
                            Total = Convert.ToInt32(reader["TotalGeral"])
                        };
                        dto.CargaPorColaborador.Add(faixa);
                    }
                    faixa.Itens.Add(MapearLinha(reader, usarNomeFantasia));
                }
            }

            return dto;
        }

        // --- Projetos -----------------------------------------------------------------------

        private async Task<DashboardProjetosDTO> ObterProjetosAsync(
            SqlConnection con, bool usarNomeFantasia, DashboardPeriodoDTO periodo)
        {
            var dto = new DashboardProjetosDTO();
            await using var cmd = con.CreateCommand();
            PrepararParametros(cmd, 0, periodo);

            dto.Ativos = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasProjeto},
                    COALESCE(alt.Nome, cad.Nome) AS UltimaAcaoPor,
                    COALESCE(p.DataAlteracao, p.DataCadastro) AS UltimaAcaoEm{TotalGeral}
                {DeProjeto}
                WHERE p.Ativo = 1 AND p.Concluido = 0
                ORDER BY p.DataCadastro DESC
            ", usarNomeFantasia);

            // Concluídos no período: a data vem do histórico do projeto (ProjetoHistorico, Tipo
            // 'C'), não de DataCadastro — usar a data de cadastro deixava de fora todo projeto
            // concluído fora do mês em que foi criado.
            dto.ConcluidosPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasProjeto},
                    conc.RealizadoPor AS UltimaAcaoPor,
                    conc.ConcluidoEm AS UltimaAcaoEm{TotalGeral}
                {DeProjeto}
                INNER JOIN (
                    SELECT ph.ProjetoId,
                           MAX(ph.DataHoraAcao) AS ConcluidoEm,
                           MAX(ph.RealizadoPorColaboradorNome) AS RealizadoPor
                    FROM ProjetoHistorico ph
                    WHERE ph.Tipo = 'C' AND ph.DataHoraAcao >= @Inicio AND ph.DataHoraAcao < @Fim
                    GROUP BY ph.ProjetoId
                ) conc ON conc.ProjetoId = p.Id
                WHERE p.Concluido = 1
                ORDER BY conc.ConcluidoEm DESC
            ", usarNomeFantasia);

            dto.CadastradosPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasProjeto},
                    cad.Nome AS UltimaAcaoPor,
                    p.DataCadastro AS UltimaAcaoEm{TotalGeral}
                {DeProjeto}
                WHERE p.DataCadastro >= @Inicio AND p.DataCadastro < @Fim
                ORDER BY p.DataCadastro DESC
            ", usarNomeFantasia);

            return dto;
        }

        // --- Colaboradores ------------------------------------------------------------------

        private async Task<DashboardColaboradoresDTO> ObterColaboradoresAsync(
            SqlConnection con, DashboardPeriodoDTO periodo)
        {
            var dto = new DashboardColaboradoresDTO();
            await using var cmd = con.CreateCommand();
            PrepararParametros(cmd, 0, periodo);

            // Sem TOP: a tela mostra os primeiros e tem "Ver todos".
            cmd.CommandText = @"
                SELECT c.Nome, COUNT(DISTINCT a.Id) AS Total
                FROM Atendimento a
                INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                INNER JOIN Colaborador c ON c.Id = ac.ColaboradorId
                WHERE a.Status = 'R'
                  AND a.DataHoraConclusao >= @Inicio AND a.DataHoraConclusao < @Fim
                GROUP BY c.Id, c.Nome
                ORDER BY Total DESC, c.Nome
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                    dto.AtendimentosPeriodo.Add(new TopColaboradorDTO { Nome = reader.GetString(0), Total = reader.GetInt32(1) });
            }

            // Crédito de quem estava com a etapa quando ela foi fechada (h.ColaboradorId), com
            // fallback para o responsável atual — mesmo critério do Relatório de Comissão. E
            // DISTINCT por tarefa: reabrir e reconcluir não conta duas vezes.
            cmd.CommandText = @"
                SELECT c.Nome, COUNT(DISTINCT h.TarefaId) AS Total
                FROM ProjetoTarefaHistorico h
                INNER JOIN Etapa e ON e.Id = h.EtapaId AND e.EhEtapaFinal = 1
                INNER JOIN ProjetoTarefa t ON t.Id = h.TarefaId
                INNER JOIN Colaborador c ON c.Id = COALESCE(h.ColaboradorId, t.ColaboradorResponsavelId)
                WHERE h.Tipo = 'E'
                  AND h.DataHoraAcao >= @Inicio AND h.DataHoraAcao < @Fim
                GROUP BY c.Id, c.Nome
                ORDER BY Total DESC, c.Nome
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                    dto.TarefasConcluidasPeriodo.Add(new TopColaboradorDTO { Nome = reader.GetString(0), Total = reader.GetInt32(1) });
            }

            cmd.CommandText = @"
                SELECT c.Id, c.Nome, ISNULL(s.Nome, '') AS SetorNome
                FROM Colaborador c
                LEFT JOIN Setor s ON s.Id = c.SetorId
                WHERE c.Ativo = 1
                  AND NOT EXISTS (
                      SELECT 1
                      FROM ProjetoTarefa t
                      INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                      WHERE t.ColaboradorResponsavelId = c.Id
                  )
                ORDER BY c.Nome
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.SemTarefasAtribuidas.Add(new ColaboradorOciosoDTO
                    {
                        Id = reader.GetInt32(0),
                        Nome = reader.GetString(1),
                        SetorNome = reader.GetString(2)
                    });
                }
            }

            return dto;
        }

        private async Task<List<ProjetoSemMovimentacaoDTO>> ObterProjetosSemMovimentacaoAsync(SqlConnection con)
        {
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT p.Id, p.Titulo, c.Nome,
                       MAX(h.DataHoraAcao) as UltimaMovimentacao,
                       DATEDIFF(DAY, MAX(h.DataHoraAcao), GETDATE()) as DiasParado
                FROM Projeto p
                INNER JOIN Cliente c ON c.Id = p.ClienteId
                LEFT JOIN ProjetoTarefa t ON t.ProjetoId = p.Id
                LEFT JOIN ProjetoTarefaHistorico h ON h.TarefaId = t.Id
                WHERE p.Ativo = 1 AND p.Concluido = 0
                GROUP BY p.Id, p.Titulo, c.Nome, p.DataCadastro
                HAVING MAX(h.DataHoraAcao) < DATEADD(DAY, -15, GETDATE())
                    OR (MAX(h.DataHoraAcao) IS NULL AND p.DataCadastro < DATEADD(DAY, -15, GETDATE()))
                ORDER BY UltimaMovimentacao ASC
            ";

            var lista = new List<ProjetoSemMovimentacaoDTO>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                lista.Add(new ProjetoSemMovimentacaoDTO
                {
                    Id = reader.GetInt32(0),
                    Titulo = reader.GetString(1),
                    ClienteNome = reader.GetString(2),
                    UltimaMovimentacao = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    DiasParado = reader.IsDBNull(4) ? 999 : reader.GetInt32(4)
                });
            }
            return lista;
        }

        private async Task<List<ColaboradorFiltroItemDTO>> ObterColaboradoresDisponiveisAsync(SqlConnection con)
        {
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome FROM Colaborador WHERE Ativo = 1 ORDER BY Nome";

            var lista = new List<ColaboradorFiltroItemDTO>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                lista.Add(new ColaboradorFiltroItemDTO
                {
                    Id = reader.GetInt32(0),
                    Nome = reader.GetString(1)
                });
            }
            return lista;
        }
    }
}
