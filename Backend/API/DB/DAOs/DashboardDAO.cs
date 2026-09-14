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
        // Colunas de uma linha de tarefa nas listas. Inclui o status atual (o mesmo do Kanban,
        // via TarefaSql) e quem mexeu por último, e quando.
        private static readonly string ColunasTarefa = $@"
                    t.Id,
                    t.Titulo,
                    pr.Titulo AS ProjetoTitulo,
                    cli.Nome AS ClienteNome,
                    cli.NomeFantasia AS ClienteNomeFantasia,
                    col.Nome AS ColaboradorNome,
                    e.Nome AS EtapaNome,
                    {TarefaSql.StatusAtual("t")} AS StatusAtual,
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

        // Ordem das listas de tarefa: etapa na ordem do fluxo — Atendimento (sem etapa) primeiro,
        // Reservado antes do resto da elaboração e a etapa final por último, como no Kanban — e,
        // dentro da etapa, colaborador ("Sem responsável" no fim). Serve para o ORDER BY da lista
        // e para o ORDER BY do ROW_NUMBER(), que decide quais itens entram no limite dela.
        private static readonly string OrdemTarefaEtapaColaborador = $@"
                    CASE WHEN e.Id IS NULL THEN 0 WHEN e.EhEtapaFinal = 1 THEN 2 ELSE 1 END,
                    e.Ordem,
                    CASE WHEN {TarefaSql.EhEtapaElaboracao("e")} AND {TarefaSql.StatusAtual("t")} = 'Ociosa' THEN 0 ELSE 1 END,
                    CASE WHEN col.Id IS NULL THEN 1 ELSE 0 END,
                    col.Nome,
                    t.Titulo";

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
                    SELECT STRING_AGG(colA.Nome, ', ') WITHIN GROUP (ORDER BY colA.Nome) AS Nomes
                    FROM AtendimentoColaborador ac2
                    INNER JOIN Colaborador colA ON colA.Id = ac2.ColaboradorId
                    WHERE ac2.AtendimentoId = a.Id
                ) resp";

        // Colaborador do atendimento via EXISTS (e não INNER JOIN): a relação é N:N e o join
        // duplicaria a linha — e, com COUNT(*) OVER (), duplicaria também o total.
        private const string FiltroColaboradorAtendimento =
            " AND EXISTS (SELECT 1 FROM AtendimentoColaborador ac WHERE ac.AtendimentoId = a.Id AND ac.ColaboradorId = @ColaboradorId)";

        // Atendimento não tem etapa: a lista vai por colaborador (os atribuídos, em ordem
        // alfabética), com os sem ninguém no fim; a data desempata em cada consulta.
        private const string OrdemAtendimentoColaborador = "CASE WHEN resp.Nomes IS NULL THEN 1 ELSE 0 END, resp.Nomes";

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

        // Projeto também não tem etapa: a lista vai por quem lançou; a data desempata.
        private const string OrdemProjetoColaborador = "CASE WHEN cad.Nome IS NULL THEN 1 ELSE 0 END, cad.Nome";

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

            // Visão global = admin sem filtro de colaborador. Só aí faz sentido comparar pessoas
            // (rankings, carga) ou olhar o parque de projetos; com filtro, a tela é o painel de
            // UMA pessoa. Fora da visão global isso nem é consultado — a tela não mostraria.
            bool visaoGlobal = ehAdministrador && !filtroColaboradorId.HasValue;

            var resultado = new DashboardDTO { EhAdministrador = ehAdministrador, Periodo = periodo };

            resultado.Atendimentos = await ObterAtendimentosAsync(con, idParaFiltro, filtrarPorColaborador, usarNomeFantasia, periodo);
            resultado.Tarefas = await ObterTarefasAsync(con, idParaFiltro, filtrarPorColaborador, visaoGlobal, usarNomeFantasia, periodo);

            if (visaoGlobal)
            {
                resultado.Projetos = await ObterProjetosAsync(con, usarNomeFantasia, periodo);
                resultado.Colaboradores = await ObterColaboradoresAsync(con, usarNomeFantasia, periodo);
                resultado.ProjetosSemMovimentacao = await ObterProjetosSemMovimentacaoAsync(con);
            }

            if (ehAdministrador)
            {
                // O seletor de colaborador precisa da lista mesmo com um filtro aplicado.
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

        /// <summary>
        /// Lê um ranking já particionado por colaborador: cada colocado vira uma entrada com o
        /// total e a lista do que ele fez no período.
        /// </summary>
        private static async Task LerRankingAsync(SqlCommand cmd, List<TopColaboradorDTO> destino, bool usarNomeFantasia)
        {
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var nome = Texto(reader, "RankNome") ?? "";
                var colocado = destino.FirstOrDefault(x => x.Nome == nome);
                if (colocado == null)
                {
                    colocado = new TopColaboradorDTO { Nome = nome, Total = Convert.ToInt32(reader["TotalGeral"]) };
                    destino.Add(colocado);
                }
                colocado.Itens.Add(MapearLinha(reader, usarNomeFantasia));
            }
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
                ORDER BY {OrdemAtendimentoColaborador}, a.DataHoraInicio
            ", usarNomeFantasia);

            // Pendentes do PERÍODO (antes era todo Status='A' da história inteira, um número
            // grande e sem leitura possível).
            dto.PendentesPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'A'
                  AND a.DataHoraInicio >= @Inicio AND a.DataHoraInicio < @Fim
                  {filtro}
                ORDER BY {OrdemAtendimentoColaborador}, a.DataHoraInicio
            ", usarNomeFantasia);

            dto.EmAtraso = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'A'
                  AND a.DataHoraFim IS NOT NULL AND a.DataHoraFim < GETDATE()
                  {filtro}
                ORDER BY {OrdemAtendimentoColaborador}, a.DataHoraFim
            ", usarNomeFantasia);

            dto.RealizadosPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasAtendimento}{TotalGeral}
                {DeAtendimento}
                WHERE a.Status = 'R'
                  AND a.DataHoraConclusao >= @Inicio AND a.DataHoraConclusao < @Fim
                  {filtro}
                ORDER BY {OrdemAtendimentoColaborador}, a.DataHoraConclusao DESC
            ", usarNomeFantasia);

            // Tendência: ancorada em hoje (últimos 6 meses), independente do período escolhido —
            // é a série histórica, não um recorte.
            var hoje = DateTime.Today;
            var inicioTendencia = new DateTime(hoje.Year, hoje.Month, 1).AddMonths(-5);
            cmd.Parameters.AddWithValue("@InicioTendencia", inicioTendencia);
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT{ColunasAtendimento},
                        YEAR(a.DataHoraConclusao) AS AnoMes_Ano,
                        MONTH(a.DataHoraConclusao) AS AnoMes_Mes,
                        COUNT(*) OVER (PARTITION BY YEAR(a.DataHoraConclusao), MONTH(a.DataHoraConclusao)) AS TotalGeral,
                        ROW_NUMBER() OVER (
                            PARTITION BY YEAR(a.DataHoraConclusao), MONTH(a.DataHoraConclusao)
                            ORDER BY {OrdemAtendimentoColaborador}, a.DataHoraConclusao DESC
                        ) AS Posicao
                    {DeAtendimento}
                    WHERE a.Status = 'R'
                      AND a.DataHoraConclusao >= @InicioTendencia
                      {filtro}
                ) meses
                WHERE meses.Posicao <= @Limite
                ORDER BY meses.AnoMes_Ano, meses.AnoMes_Mes, meses.Posicao
            ";

            var tendenciaBruta = new Dictionary<(int, int), TendenciaMensalDTO>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var chave = (Convert.ToInt32(reader["AnoMes_Ano"]), Convert.ToInt32(reader["AnoMes_Mes"]));
                    if (!tendenciaBruta.TryGetValue(chave, out var mes))
                    {
                        mes = new TendenciaMensalDTO { Total = Convert.ToInt32(reader["TotalGeral"]) };
                        tendenciaBruta[chave] = mes;
                    }
                    mes.Itens.Add(MapearLinha(reader, usarNomeFantasia));
                }
            }

            // Os 6 meses aparecem sempre, inclusive os zerados — o gráfico é a série, não só o
            // que teve movimento.
            var cultura = new System.Globalization.CultureInfo("pt-BR");
            for (int i = 5; i >= 0; i--)
            {
                var mesRef = hoje.AddMonths(-i);
                tendenciaBruta.TryGetValue((mesRef.Year, mesRef.Month), out var existente);
                dto.Tendencia.Add(new TendenciaMensalDTO
                {
                    Ano = mesRef.Year,
                    Mes = mesRef.Month,
                    Total = existente?.Total ?? 0,
                    Itens = existente?.Itens ?? new(),
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
            SqlConnection con, int colaboradorId, bool filtrarPorColaborador, bool visaoGlobal,
            bool usarNomeFantasia, DashboardPeriodoDTO periodo)
        {
            var dto = new DashboardTarefasDTO();
            await using var cmd = con.CreateCommand();
            PrepararParametros(cmd, colaboradorId, periodo);

            var filtro = filtrarPorColaborador ? " AND t.ColaboradorResponsavelId = @ColaboradorId" : "";

            // Em andamento = tem etapa e não é a final. Antes contava TODAS as tarefas de projetos
            // ativos (atendimento e concluídas junto) e ainda servia de denominador das barras "Por
            // Etapa", o que deixava os percentuais errados.
            dto.EmAndamento = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                WHERE t.EtapaId IS NOT NULL AND e.EhEtapaFinal = 0
                  {ProjetoAtivo}{filtro}
                ORDER BY{OrdemTarefaEtapaColaborador}
            ", usarNomeFantasia);

            dto.Atendimento = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                {DeTarefa}
                WHERE t.EtapaId IS NULL
                  {ProjetoAtivo}{filtro}
                ORDER BY{OrdemTarefaEtapaColaborador}
            ", usarNomeFantasia);

            if (visaoGlobal)
            {
                // Só tarefas JÁ no fluxo. Mover para Atendimento remove o responsável (regra do
                // Kanban), então toda tarefa em atendimento está sem responsável por construção —
                // contá-las aqui repetia o card Atendimento inteiro e escondia o que interessa:
                // tarefa andando no fluxo sem ninguém responsável.
                dto.SemResponsavel = await LerIndicadorAsync(cmd, $@"
                    SELECT TOP (@Limite){ColunasTarefa}{TotalGeral}
                    {DeTarefa}
                    WHERE t.ColaboradorResponsavelId IS NULL
                      AND t.EtapaId IS NOT NULL AND e.EhEtapaFinal = 0
                      {ProjetoAtivo}
                    ORDER BY{OrdemTarefaEtapaColaborador}
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
                ORDER BY{OrdemTarefaEtapaColaborador}
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
                ORDER BY{OrdemTarefaEtapaColaborador}
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
                ORDER BY{OrdemTarefaEtapaColaborador}
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
                ORDER BY{OrdemTarefaEtapaColaborador}
            ", usarNomeFantasia);

            // Por etapa, com a lista de cada faixa: uma consulta só, com o total por faixa
            // (COUNT OVER PARTITION) e a lista cortada por faixa (ROW_NUMBER). A etapa de
            // elaboração vira duas faixas: Reservado (ainda não iniciada) e a própria etapa (já
            // começou) — ver TarefaSql.EhEtapaElaboracao. As demais etapas têm só a faixa 0.
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT base.*, r.Reservado,
                        COUNT(*) OVER (PARTITION BY base.EtapaIdFaixa, r.Reservado) AS TotalGeral,
                        ROW_NUMBER() OVER (
                            PARTITION BY base.EtapaIdFaixa, r.Reservado
                            ORDER BY CASE WHEN base.ColaboradorNome IS NULL THEN 1 ELSE 0 END, base.ColaboradorNome, base.Titulo
                        ) AS Posicao
                    FROM (
                        SELECT{ColunasTarefa},
                            t.EtapaId AS EtapaIdFaixa,
                            e.Ordem AS EtapaOrdem,
                            e.EhEtapaFinal AS EtapaFinal,
                            CASE WHEN {TarefaSql.EhEtapaElaboracao("e")} THEN 1 ELSE 0 END AS EtapaElaboracao
                        {DeTarefa}
                        WHERE t.EtapaId IS NOT NULL
                          {ProjetoAtivo}{filtro}
                    ) base
                    CROSS APPLY (
                        SELECT CASE WHEN base.EtapaElaboracao = 1 AND base.StatusAtual = 'Ociosa' THEN 1 ELSE 0 END AS Reservado
                    ) r
                ) faixas
                WHERE faixas.Posicao <= @Limite
                ORDER BY faixas.EtapaOrdem, faixas.Reservado DESC, faixas.Posicao
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var etapaId = Convert.ToInt32(reader["EtapaIdFaixa"]);
                    var reservado = Convert.ToInt32(reader["Reservado"]) == 1;
                    var faixa = dto.PorEtapa.FirstOrDefault(f => f.EtapaId == etapaId && f.Reservado == reservado);
                    if (faixa == null)
                    {
                        faixa = new TarefaPorEtapaDTO
                        {
                            EtapaId = etapaId,
                            Reservado = reservado,
                            Etapa = reservado ? "Reservado" : Texto(reader, "EtapaNome") ?? "",
                            Ordem = Convert.ToInt32(reader["EtapaOrdem"]),
                            EhEtapaFinal = Convert.ToBoolean(reader["EtapaFinal"]),
                            Total = Convert.ToInt32(reader["TotalGeral"])
                        };
                        dto.PorEtapa.Add(faixa);
                    }
                    faixa.Itens.Add(MapearLinha(reader, usarNomeFantasia));
                }
            }

            // Atendimento entra como a primeira faixa, reaproveitando o indicador já lido.
            if (dto.Atendimento.Total > 0)
            {
                dto.PorEtapa.Insert(0, new TarefaPorEtapaDTO
                {
                    EtapaId = null,
                    Etapa = "Atendimento",
                    Ordem = -1,
                    EhEtapaFinal = false,
                    Total = dto.Atendimento.Total,
                    Itens = dto.Atendimento.Itens
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
                        ROW_NUMBER() OVER (PARTITION BY p.Id ORDER BY{OrdemTarefaEtapaColaborador}) AS Posicao
                    {DeTarefa}
                    INNER JOIN Prioridade p ON p.Id = t.PrioridadeId
                    WHERE COALESCE(e.EhEtapaFinal, 0) = 0
                      {ProjetoAtivo}{filtro}
                ) faixas
                WHERE faixas.Posicao <= @Limite
                ORDER BY faixas.PrioridadeOrdem, faixas.Posicao
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

            // Carga por colaborador: comparação entre pessoas, só faz sentido na visão global.
            // Para o usuário comum (e quando o admin filtra por alguém) isso seria dado de
            // terceiros, sem serventia para quem está olhando o próprio painel.
            if (visaoGlobal)
            {
                cmd.CommandText = $@"
                    SELECT * FROM (
                        SELECT{ColunasTarefa},
                            col.Id AS CargaColaboradorId,
                            COUNT(*) OVER (PARTITION BY col.Id) AS TotalGeral,
                            ROW_NUMBER() OVER (PARTITION BY col.Id ORDER BY{OrdemTarefaEtapaColaborador}) AS Posicao
                        {DeTarefa}
                        WHERE t.ColaboradorResponsavelId IS NOT NULL
                          AND COALESCE(e.EhEtapaFinal, 0) = 0
                          {ProjetoAtivo}
                    ) faixas
                    WHERE faixas.Posicao <= @Limite
                    ORDER BY faixas.TotalGeral DESC, faixas.ColaboradorNome, faixas.CargaColaboradorId, faixas.Posicao
                ";
                await using var reader = await cmd.ExecuteReaderAsync();
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
                ORDER BY {OrdemProjetoColaborador}, p.DataCadastro DESC
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
                ORDER BY {OrdemProjetoColaborador}, conc.ConcluidoEm DESC
            ", usarNomeFantasia);

            dto.CadastradosPeriodo = await LerIndicadorAsync(cmd, $@"
                SELECT TOP (@Limite){ColunasProjeto},
                    cad.Nome AS UltimaAcaoPor,
                    p.DataCadastro AS UltimaAcaoEm{TotalGeral}
                {DeProjeto}
                WHERE p.DataCadastro >= @Inicio AND p.DataCadastro < @Fim
                ORDER BY {OrdemProjetoColaborador}, p.DataCadastro DESC
            ", usarNomeFantasia);

            return dto;
        }

        // --- Colaboradores ------------------------------------------------------------------

        private async Task<DashboardColaboradoresDTO> ObterColaboradoresAsync(
            SqlConnection con, bool usarNomeFantasia, DashboardPeriodoDTO periodo)
        {
            var dto = new DashboardColaboradoresDTO();
            await using var cmd = con.CreateCommand();
            PrepararParametros(cmd, 0, periodo);

            // Sem TOP no ranking (a tela mostra os primeiros e tem "Ver todos"), e cada colocado
            // traz a lista do que ele fez — o número sozinho não deixa conferir nada.
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT{ColunasAtendimento},
                        colRank.Id AS RankId,
                        colRank.Nome AS RankNome,
                        COUNT(*) OVER (PARTITION BY colRank.Id) AS TotalGeral,
                        ROW_NUMBER() OVER (PARTITION BY colRank.Id ORDER BY a.DataHoraConclusao DESC) AS Posicao
                    {DeAtendimento}
                    INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                    INNER JOIN Colaborador colRank ON colRank.Id = ac.ColaboradorId
                    WHERE a.Status = 'R'
                      AND a.DataHoraConclusao >= @Inicio AND a.DataHoraConclusao < @Fim
                ) rank
                WHERE rank.Posicao <= @Limite
                ORDER BY rank.TotalGeral DESC, rank.RankNome, rank.Posicao
            ";
            await LerRankingAsync(cmd, dto.AtendimentosPeriodo, usarNomeFantasia);

            // Crédito de quem estava com a etapa quando ela foi fechada (h.ColaboradorId), com
            // fallback para o responsável atual — mesmo critério do Relatório de Comissão. E
            // DISTINCT por tarefa: reabrir e reconcluir não conta duas vezes.
            cmd.CommandText = $@"
                SELECT * FROM (
                    SELECT{ColunasTarefa},
                        colRank.Id AS RankId,
                        colRank.Nome AS RankNome,
                        COUNT(*) OVER (PARTITION BY colRank.Id) AS TotalGeral,
                        ROW_NUMBER() OVER (PARTITION BY colRank.Id ORDER BY{OrdemTarefaEtapaColaborador}) AS Posicao
                    {DeTarefa}
                    INNER JOIN (
                        SELECT DISTINCT
                            COALESCE(h.ColaboradorId, tc.ColaboradorResponsavelId) AS ColaboradorId,
                            h.TarefaId
                        FROM ProjetoTarefaHistorico h
                        INNER JOIN Etapa ef ON ef.Id = h.EtapaId AND ef.EhEtapaFinal = 1
                        INNER JOIN ProjetoTarefa tc ON tc.Id = h.TarefaId
                        WHERE h.Tipo = 'E'
                          AND h.DataHoraAcao >= @Inicio AND h.DataHoraAcao < @Fim
                    ) credito ON credito.TarefaId = t.Id
                    INNER JOIN Colaborador colRank ON colRank.Id = credito.ColaboradorId
                ) rank
                WHERE rank.Posicao <= @Limite
                ORDER BY rank.TotalGeral DESC, rank.RankNome, rank.Posicao
            ";
            await LerRankingAsync(cmd, dto.TarefasConcluidasPeriodo, usarNomeFantasia);

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
