using API.Models;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class AtendimentosDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Atendimento atendimento)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                await using var cmd = con.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO Atendimento
                    (Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataHoraInicio, DataHoraFim, Status, Ativo, DataCadastro)
                    VALUES
                    (@Titulo, @Descricao, @ClienteId, @CadastradoPorColaboradorId, @DataHoraInicio, @DataHoraFim, @Status, @Ativo, @DataCadastro);
                    SELECT CAST(SCOPE_IDENTITY() AS int);
                ";

                cmd.Parameters.AddWithValue("@Titulo", atendimento.Titulo);
                cmd.Parameters.AddWithValue("@Descricao", (object?)atendimento.Descricao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ClienteId", atendimento.ClienteId);
                cmd.Parameters.AddWithValue("@CadastradoPorColaboradorId", atendimento.CadastradoPorColaboradorId);
                cmd.Parameters.AddWithValue("@DataHoraInicio", atendimento.DataHoraInicio);
                cmd.Parameters.AddWithValue("@DataHoraFim", (object?)atendimento.DataHoraFim ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Status", atendimento.Status);
                cmd.Parameters.AddWithValue("@Ativo", atendimento.Ativo);
                cmd.Parameters.AddWithValue("@DataCadastro", atendimento.DataCadastro);

                var result = await cmd.ExecuteScalarAsync();
                atendimento.Id = Convert.ToInt32(result);

                await InserirColaboradoresAsync(con, transaction, atendimento.Id, atendimento.ColaboradoresIds);
                await InserirNotificacoesAsync(con, transaction, atendimento.Id, atendimento.NotificacoesMinutosAntecedencia);
                await transaction.CommitAsync();

                return atendimento.Id;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Atendimento atendimento)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                await using var cmd = con.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    UPDATE Atendimento
                    SET Titulo = @Titulo,
                        Descricao = @Descricao,
                        ClienteId = @ClienteId,
                        CadastradoPorColaboradorId = @CadastradoPorColaboradorId,
                        DataHoraInicio = @DataHoraInicio,
                        DataHoraFim = @DataHoraFim
                    WHERE Id = @Id;
                ";

                cmd.Parameters.AddWithValue("@Id", atendimento.Id);
                cmd.Parameters.AddWithValue("@Titulo", atendimento.Titulo);
                cmd.Parameters.AddWithValue("@Descricao", (object?)atendimento.Descricao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ClienteId", atendimento.ClienteId);
                cmd.Parameters.AddWithValue("@CadastradoPorColaboradorId", atendimento.CadastradoPorColaboradorId);
                cmd.Parameters.AddWithValue("@DataHoraInicio", atendimento.DataHoraInicio);
                cmd.Parameters.AddWithValue("@DataHoraFim", (object?)atendimento.DataHoraFim ?? DBNull.Value);

                int linhas = await cmd.ExecuteNonQueryAsync();
                if (linhas == 0)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                await RemoverColaboradoresPorAtendimentoIdAsync(con, transaction, atendimento.Id);
                await InserirColaboradoresAsync(con, transaction, atendimento.Id, atendimento.ColaboradoresIds);
                await RemoverNotificacoesPorAtendimentoIdAsync(con, transaction, atendimento.Id);
                await InserirNotificacoesAsync(con, transaction, atendimento.Id, atendimento.NotificacoesMinutosAntecedencia);
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Atendimento SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Atendimento SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> AtualizarComoRealizadoAsync(
            DBContext dbContext,
            int id,
            int concluidoPorColaboradorId,
            string? observacaoConclusao)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                var dataHoraAcao = DateTime.Now;

                await using var cmd = con.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    UPDATE Atendimento
                    SET Status = 'R',
                        ObservacaoConclusao = @ObservacaoConclusao,
                        ConcluidoPorColaboradorId = @ConcluidoPorColaboradorId,
                        DataHoraConclusao = @DataHoraConclusao
                    WHERE Id = @Id
                ";
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.Parameters.AddWithValue("@ObservacaoConclusao", (object?)observacaoConclusao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ConcluidoPorColaboradorId", concluidoPorColaboradorId);
                cmd.Parameters.AddWithValue("@DataHoraConclusao", dataHoraAcao);

                int linhas = await cmd.ExecuteNonQueryAsync();
                if (linhas == 0)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                await InserirHistoricoStatusAsync(
                    con,
                    transaction,
                    id,
                    'C',
                    concluidoPorColaboradorId,
                    observacaoConclusao,
                    dataHoraAcao);

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> AtualizarComoAgendadoAsync(
            DBContext dbContext,
            int id,
            int reabertoPorColaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                var dataHoraAcao = DateTime.Now;

                await using var cmd = con.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    UPDATE Atendimento
                    SET Status = 'A',
                        ObservacaoConclusao = NULL,
                        ConcluidoPorColaboradorId = NULL,
                        DataHoraConclusao = NULL
                    WHERE Id = @Id
                ";
                cmd.Parameters.AddWithValue("@Id", id);

                int linhas = await cmd.ExecuteNonQueryAsync();
                if (linhas == 0)
                {
                    await transaction.RollbackAsync();
                    return false;
                }

                await InserirHistoricoStatusAsync(
                    con,
                    transaction,
                    id,
                    'R',
                    reabertoPorColaboradorId,
                    null,
                    dataHoraAcao);

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<Atendimento>> ObterTodosAsync(DBContext dbContext, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var lista = new List<Atendimento>();

            await using var con = await dbContext.GetConnectionAsync();
            await AtualizarAtendimentosVencidosAsync(con);

            {
                await using var cmd = con.CreateCommand();
                cmd.CommandText = @"
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataHoraInicio, DataHoraFim, Status, ObservacaoConclusao, ConcluidoPorColaboradorId, DataHoraConclusao, Ativo, DataCadastro
                    FROM Atendimento
                    WHERE (@DataInicio IS NULL OR COALESCE(DataHoraFim, DataHoraInicio) >= @DataInicio)
                      AND (@DataFim IS NULL OR DataHoraInicio <= @DataFim)
                    ORDER BY DataHoraInicio;
                ";
                cmd.Parameters.AddWithValue("@DataInicio", (object?)dataInicio ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DataFim", (object?)dataFim ?? DBNull.Value);

                await using var dr = await cmd.ExecuteReaderAsync();
                while (await dr.ReadAsync())
                {
                    var atendimento = new Atendimento
                    {
                        Id = Convert.ToInt32(dr["Id"]),
                        Titulo = dr["Titulo"].ToString() ?? string.Empty,
                        Descricao = dr["Descricao"]?.ToString(),
                        ClienteId = Convert.ToInt32(dr["ClienteId"]),
                        CadastradoPorColaboradorId = Convert.ToInt32(dr["CadastradoPorColaboradorId"]),
                        DataHoraInicio = Convert.ToDateTime(dr["DataHoraInicio"]),
                        DataHoraFim = dr["DataHoraFim"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataHoraFim"]),
                        Status = Convert.ToChar(dr["Status"]),
                        ObservacaoConclusao = dr["ObservacaoConclusao"] == DBNull.Value ? null : dr["ObservacaoConclusao"].ToString(),
                        ConcluidoPorColaboradorId = dr["ConcluidoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["ConcluidoPorColaboradorId"]),
                        DataHoraConclusao = dr["DataHoraConclusao"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataHoraConclusao"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        DataCadastro = Convert.ToDateTime(dr["DataCadastro"])
                    };

                    lista.Add(atendimento);
                }
            }

            foreach (var atendimento in lista)
            {
                atendimento.ColaboradoresIds = (await ObterColaboradoresIdsAsync(con, atendimento.Id)).ToList();
                atendimento.NotificacoesMinutosAntecedencia = (await ObterNotificacoesAsync(con, atendimento.Id)).ToList();
                atendimento.HistoricoStatus = (await ObterHistoricoStatusAsync(con, atendimento.Id)).ToList();
            }

            return lista;
        }

        public async Task<Atendimento?> ObterPorIdAsync(DBContext dbContext, int id, bool aplicarAutoFinalizacao = true)
        {
            Atendimento? atendimento = null;

            await using var con = await dbContext.GetConnectionAsync();
            if (aplicarAutoFinalizacao)
                await AtualizarAtendimentosVencidosAsync(con);

            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataHoraInicio, DataHoraFim, Status, ObservacaoConclusao, ConcluidoPorColaboradorId, DataHoraConclusao, Ativo, DataCadastro
                FROM Atendimento
                WHERE Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", id);

            {
                await using var dr = await cmd.ExecuteReaderAsync();
                if (await dr.ReadAsync())
                {
                    atendimento = new Atendimento
                    {
                        Id = Convert.ToInt32(dr["Id"]),
                        Titulo = dr["Titulo"].ToString() ?? string.Empty,
                        Descricao = dr["Descricao"]?.ToString(),
                        ClienteId = Convert.ToInt32(dr["ClienteId"]),
                        CadastradoPorColaboradorId = Convert.ToInt32(dr["CadastradoPorColaboradorId"]),
                        DataHoraInicio = Convert.ToDateTime(dr["DataHoraInicio"]),
                        DataHoraFim = dr["DataHoraFim"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataHoraFim"]),
                        Status = Convert.ToChar(dr["Status"]),
                        ObservacaoConclusao = dr["ObservacaoConclusao"] == DBNull.Value ? null : dr["ObservacaoConclusao"].ToString(),
                        ConcluidoPorColaboradorId = dr["ConcluidoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["ConcluidoPorColaboradorId"]),
                        DataHoraConclusao = dr["DataHoraConclusao"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataHoraConclusao"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        DataCadastro = Convert.ToDateTime(dr["DataCadastro"])
                    };
                }
            }

            if (atendimento != null)
            {
                atendimento.ColaboradoresIds = (await ObterColaboradoresIdsAsync(con, atendimento.Id)).ToList();
                atendimento.NotificacoesMinutosAntecedencia = (await ObterNotificacoesAsync(con, atendimento.Id)).ToList();
                atendimento.HistoricoStatus = (await ObterHistoricoStatusAsync(con, atendimento.Id)).ToList();
            }

            return atendimento;
        }

        public async Task<bool> ExisteConflitoHorarioAsync(
            DBContext dbContext,
            int colaboradorId,
            DateTime dataHoraInicio,
            DateTime? dataHoraFim,
            int? atendimentoIdIgnorar = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM Atendimento a
                INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                WHERE ac.ColaboradorId = @ColaboradorId
                  AND a.Ativo = 1
                  AND (@AtendimentoIdIgnorar IS NULL OR a.Id <> @AtendimentoIdIgnorar)
                  AND @NovoInicio < COALESCE(a.DataHoraFim, DATEADD(MINUTE, 1, a.DataHoraInicio))
                  AND a.DataHoraInicio < COALESCE(@NovoFim, DATEADD(MINUTE, 1, @NovoInicio));
            ";

            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@AtendimentoIdIgnorar", (object?)atendimentoIdIgnorar ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@NovoInicio", dataHoraInicio);
            cmd.Parameters.AddWithValue("@NovoFim", (object?)dataHoraFim ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        public async Task<IEnumerable<AtendimentoHistoricoRelatorioItem>> ObterHistoricoStatusRelatorioAsync(
            DBContext dbContext,
            DateTime? dataInicio = null,
            DateTime? dataFim = null,
            char? tipo = null,
            int? colaboradorId = null,
            int? clienteId = null,
            int? atendimentoId = null)
        {
            var lista = new List<AtendimentoHistoricoRelatorioItem>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT
                    hs.Id,
                    hs.AtendimentoId,
                    a.Titulo AS AtendimentoTitulo,
                    a.ClienteId,
                    cl.Nome AS ClienteNome,
                    hs.Tipo,
                    hs.ColaboradorId,
                    c.Nome AS ColaboradorNome,
                    hs.DataHoraAcao,
                    hs.Observacao,
                    a.Status AS AtendimentoStatusAtual
                FROM AtendimentoHistoricoStatus hs
                INNER JOIN Atendimento a ON a.Id = hs.AtendimentoId
                INNER JOIN Cliente cl ON cl.Id = a.ClienteId
                INNER JOIN Colaborador c ON c.Id = hs.ColaboradorId
                WHERE (@DataInicio IS NULL OR hs.DataHoraAcao >= @DataInicio)
                  AND (@DataFim IS NULL OR hs.DataHoraAcao <= @DataFim)
                  AND (@Tipo IS NULL OR hs.Tipo = @Tipo)
                  AND (@ColaboradorId IS NULL OR hs.ColaboradorId = @ColaboradorId)
                  AND (@ClienteId IS NULL OR a.ClienteId = @ClienteId)
                  AND (@AtendimentoId IS NULL OR hs.AtendimentoId = @AtendimentoId)
                ORDER BY hs.DataHoraAcao DESC, hs.Id DESC;
            ";

            cmd.Parameters.AddWithValue("@DataInicio", (object?)dataInicio ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataFim", (object?)dataFim ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Tipo", (object?)tipo ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ColaboradorId", (object?)colaboradorId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ClienteId", (object?)clienteId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@AtendimentoId", (object?)atendimentoId ?? DBNull.Value);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new AtendimentoHistoricoRelatorioItem
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    AtendimentoId = Convert.ToInt32(dr["AtendimentoId"]),
                    AtendimentoTitulo = dr["AtendimentoTitulo"]?.ToString() ?? string.Empty,
                    ClienteId = Convert.ToInt32(dr["ClienteId"]),
                    ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                    Tipo = Convert.ToChar(dr["Tipo"]),
                    ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                    ColaboradorNome = dr["ColaboradorNome"]?.ToString() ?? string.Empty,
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"]),
                    Observacao = dr["Observacao"] == DBNull.Value ? null : dr["Observacao"].ToString(),
                    AtendimentoStatusAtual = Convert.ToChar(dr["AtendimentoStatusAtual"])
                });
            }

            return lista;
        }

        private static async Task AtualizarAtendimentosVencidosAsync(SqlConnection connection)
        {
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                UPDATE Atendimento
                SET Status = 'R'
                WHERE Ativo = 1
                  AND Status = 'A'
                  AND DataHoraFim IS NOT NULL
                  AND DataHoraFim <= @Agora
                  AND NOT EXISTS (
                      SELECT 1
                      FROM AtendimentoHistoricoStatus hs
                      WHERE hs.AtendimentoId = Atendimento.Id
                  );
            ";
            cmd.Parameters.AddWithValue("@Agora", DateTime.Now);
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task InserirHistoricoStatusAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId,
            char tipo,
            int colaboradorId,
            string? observacao,
            DateTime dataHoraAcao)
        {
            await using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = @"
                INSERT INTO AtendimentoHistoricoStatus
                (AtendimentoId, Tipo, ColaboradorId, DataHoraAcao, Observacao)
                VALUES
                (@AtendimentoId, @Tipo, @ColaboradorId, @DataHoraAcao, @Observacao);
            ";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
            cmd.Parameters.AddWithValue("@Tipo", tipo);
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@DataHoraAcao", dataHoraAcao);
            cmd.Parameters.AddWithValue("@Observacao", (object?)observacao ?? DBNull.Value);
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task<IEnumerable<AtendimentoHistoricoStatus>> ObterHistoricoStatusAsync(SqlConnection connection, int atendimentoId)
        {
            var historico = new List<AtendimentoHistoricoStatus>();

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT hs.Id, hs.AtendimentoId, hs.Tipo, hs.ColaboradorId, c.Nome AS ColaboradorNome, hs.DataHoraAcao, hs.Observacao
                FROM AtendimentoHistoricoStatus hs
                INNER JOIN Colaborador c ON c.Id = hs.ColaboradorId
                WHERE hs.AtendimentoId = @AtendimentoId
                ORDER BY hs.DataHoraAcao DESC, hs.Id DESC;
            ";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                historico.Add(new AtendimentoHistoricoStatus
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    AtendimentoId = Convert.ToInt32(dr["AtendimentoId"]),
                    Tipo = Convert.ToChar(dr["Tipo"]),
                    ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                    ColaboradorNome = dr["ColaboradorNome"] == DBNull.Value ? null : dr["ColaboradorNome"].ToString(),
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"]),
                    Observacao = dr["Observacao"] == DBNull.Value ? null : dr["Observacao"].ToString()
                });
            }

            return historico;
        }

        private static async Task InserirColaboradoresAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId,
            IEnumerable<int> colaboradoresIds)
        {
            foreach (var colaboradorId in colaboradoresIds.Distinct())
            {
                await using var cmd = connection.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO AtendimentoColaborador (AtendimentoId, ColaboradorId)
                    VALUES (@AtendimentoId, @ColaboradorId);
                ";
                cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
                await cmd.ExecuteNonQueryAsync();
            }
        }

        private static async Task RemoverColaboradoresPorAtendimentoIdAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId)
        {
            await using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = "DELETE FROM AtendimentoColaborador WHERE AtendimentoId = @AtendimentoId";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task<IEnumerable<int>> ObterColaboradoresIdsAsync(SqlConnection connection, int atendimentoId)
        {
            var ids = new List<int>();

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT ColaboradorId
                FROM AtendimentoColaborador
                WHERE AtendimentoId = @AtendimentoId
                ORDER BY ColaboradorId;
            ";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
                ids.Add(Convert.ToInt32(dr["ColaboradorId"]));

            return ids;
        }

        private static async Task InserirNotificacoesAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId,
            IEnumerable<int> notificacoesMinutos)
        {
            foreach (var minutos in notificacoesMinutos.Distinct().OrderBy(x => x))
            {
                await using var cmd = connection.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO AtendimentoNotificacao (AtendimentoId, MinutosAntecedencia)
                    VALUES (@AtendimentoId, @MinutosAntecedencia);
                ";
                cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
                cmd.Parameters.AddWithValue("@MinutosAntecedencia", minutos);
                await cmd.ExecuteNonQueryAsync();
            }
        }

        private static async Task RemoverNotificacoesPorAtendimentoIdAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId)
        {
            await using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = "DELETE FROM AtendimentoNotificacao WHERE AtendimentoId = @AtendimentoId";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
            await cmd.ExecuteNonQueryAsync();
        }

        private static async Task<IEnumerable<int>> ObterNotificacoesAsync(SqlConnection connection, int atendimentoId)
        {
            var notificacoes = new List<int>();

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT MinutosAntecedencia
                FROM AtendimentoNotificacao
                WHERE AtendimentoId = @AtendimentoId
                ORDER BY MinutosAntecedencia;
            ";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
                notificacoes.Add(Convert.ToInt32(dr["MinutosAntecedencia"]));

            return notificacoes;
        }

    }
}
