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

                await using var cmdDelete = con.CreateCommand();
                cmdDelete.Transaction = transaction;
                cmdDelete.CommandText = "DELETE FROM AtendimentoColaborador WHERE AtendimentoId = @AtendimentoId";
                cmdDelete.Parameters.AddWithValue("@AtendimentoId", atendimento.Id);
                await cmdDelete.ExecuteNonQueryAsync();

                await InserirColaboradoresAsync(con, transaction, atendimento.Id, atendimento.ColaboradoresIds);
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

        public async Task<bool> AtualizarStatusAsync(DBContext dbContext, int id, char status)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Atendimento SET Status = @Status WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);
            cmd.Parameters.AddWithValue("@Status", status);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<Atendimento>> ObterTodosAsync(DBContext dbContext, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            var lista = new List<Atendimento>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataHoraInicio, DataHoraFim, Status, Ativo, DataCadastro
                FROM Atendimento
                WHERE (@DataInicio IS NULL OR DataHoraInicio >= @DataInicio)
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
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    DataCadastro = Convert.ToDateTime(dr["DataCadastro"])
                };

                lista.Add(atendimento);
            }

            foreach (var atendimento in lista)
                atendimento.ColaboradoresIds = (await ObterColaboradoresIdsAsync(dbContext, atendimento.Id)).ToList();

            return lista;
        }

        public async Task<Atendimento?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            Atendimento? atendimento = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataHoraInicio, DataHoraFim, Status, Ativo, DataCadastro
                FROM Atendimento
                WHERE Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", id);

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
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    DataCadastro = Convert.ToDateTime(dr["DataCadastro"])
                };
            }

            if (atendimento != null)
                atendimento.ColaboradoresIds = (await ObterColaboradoresIdsAsync(dbContext, atendimento.Id)).ToList();

            return atendimento;
        }

        public async Task<IEnumerable<int>> ObterColaboradoresIdsAsync(DBContext dbContext, int atendimentoId)
        {
            var ids = new List<int>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
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
                  AND @NovoInicio < COALESCE(a.DataHoraFim, a.DataHoraInicio)
                  AND a.DataHoraInicio < COALESCE(@NovoFim, @NovoInicio);
            ";

            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@AtendimentoIdIgnorar", (object?)atendimentoIdIgnorar ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@NovoInicio", dataHoraInicio);
            cmd.Parameters.AddWithValue("@NovoFim", (object?)dataHoraFim ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
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
    }
}
