using API.Models;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class ProjetosDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Projeto projeto)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                await using var cmd = con.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO Projeto
                    (Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, SetorId)
                    VALUES
                    (@Titulo, @Descricao, @ClienteId, @CadastradoPorColaboradorId, @DataCadastro, @Ativo, @SetorId);
                    SELECT CAST(SCOPE_IDENTITY() AS int);
                ";

                cmd.Parameters.AddWithValue("@Titulo", projeto.Titulo);
                cmd.Parameters.AddWithValue("@Descricao", (object?)projeto.Descricao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ClienteId", projeto.ClienteId);
                cmd.Parameters.AddWithValue("@CadastradoPorColaboradorId", projeto.CadastradoPorColaboradorId);
                cmd.Parameters.AddWithValue("@DataCadastro", projeto.DataCadastro);
                cmd.Parameters.AddWithValue("@Ativo", projeto.Ativo);
                cmd.Parameters.AddWithValue("@SetorId", projeto.SetorId);

                var result = await cmd.ExecuteScalarAsync();
                projeto.Id = Convert.ToInt32(result);

                await InserirTarefasAsync(con, transaction, projeto.Id, projeto.Tarefas);
                await transaction.CommitAsync();

                return projeto.Id;
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
            cmd.CommandText = "UPDATE Projeto SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            var linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Projeto projeto)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = con.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = @"
                        UPDATE Projeto SET
                            Titulo = @Titulo,
                            Descricao = @Descricao,
                            ClienteId = @ClienteId,
                            SetorId = @SetorId
                        WHERE Id = @Id;
                    ";

                    cmd.Parameters.AddWithValue("@Id", projeto.Id);
                    cmd.Parameters.AddWithValue("@Titulo", projeto.Titulo);
                    cmd.Parameters.AddWithValue("@Descricao", (object?)projeto.Descricao ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ClienteId", projeto.ClienteId);
                    cmd.Parameters.AddWithValue("@SetorId", projeto.SetorId);

                    var linhasProjeto = await cmd.ExecuteNonQueryAsync();
                    if (linhasProjeto == 0)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
                }

                await using (var deleteCmd = con.CreateCommand())
                {
                    deleteCmd.Transaction = transaction;
                    deleteCmd.CommandText = "DELETE FROM ProjetoTarefa WHERE ProjetoId = @ProjetoId";
                    deleteCmd.Parameters.AddWithValue("@ProjetoId", projeto.Id);
                    await deleteCmd.ExecuteNonQueryAsync();
                }

                await InserirTarefasAsync(con, transaction, projeto.Id, projeto.Tarefas);
                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Projeto SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            var linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<Projeto>> ObterTodosAsync(DBContext dbContext)
        {
            var lista = new List<Projeto>();

            await using var con = await dbContext.GetConnectionAsync();
            await using (var cmd = con.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, SetorId
                    FROM Projeto
                    ORDER BY DataCadastro DESC, Id DESC;
                ";

                await using var dr = await cmd.ExecuteReaderAsync();
                while (await dr.ReadAsync())
                {
                    lista.Add(new Projeto
                    {
                        Id = Convert.ToInt32(dr["Id"]),
                        Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                        Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                        ClienteId = Convert.ToInt32(dr["ClienteId"]),
                        CadastradoPorColaboradorId = Convert.ToInt32(dr["CadastradoPorColaboradorId"]),
                        DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        SetorId = Convert.ToInt32(dr["SetorId"])
                    });
                }
            }

            foreach (var projeto in lista)
                projeto.Tarefas = (await ObterTarefasPorProjetoIdAsync(con, projeto.Id)).ToList();

            return lista;
        }

        public async Task<Projeto?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            Projeto? projeto = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using (var cmd = con.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, SetorId
                    FROM Projeto
                    WHERE Id = @Id;
                ";
                cmd.Parameters.AddWithValue("@Id", id);

                await using var dr = await cmd.ExecuteReaderAsync();
                if (await dr.ReadAsync())
                {
                    projeto = new Projeto
                    {
                        Id = Convert.ToInt32(dr["Id"]),
                        Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                        Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                        ClienteId = Convert.ToInt32(dr["ClienteId"]),
                        CadastradoPorColaboradorId = Convert.ToInt32(dr["CadastradoPorColaboradorId"]),
                        DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        SetorId = Convert.ToInt32(dr["SetorId"])
                    };
                }
            }

            if (projeto != null)
                projeto.Tarefas = (await ObterTarefasPorProjetoIdAsync(con, projeto.Id)).ToList();

            return projeto;
        }

        private static async Task InserirTarefasAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int projetoId,
            IEnumerable<ProjetoTarefa> tarefas)
        {
            foreach (var tarefa in tarefas)
            {
                await using var cmd = connection.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO ProjetoTarefa
                    (ProjetoId, Titulo, Descricao, PrioridadeId, ColaboradorResponsavelId, DataHoraAtribuicao, EtapaId)
                    VALUES
                    (@ProjetoId, @Titulo, @Descricao, @PrioridadeId, @ColaboradorResponsavelId, @DataHoraAtribuicao, @EtapaId);
                    SELECT CAST(SCOPE_IDENTITY() AS int);
                ";

                cmd.Parameters.AddWithValue("@ProjetoId", projetoId);
                cmd.Parameters.AddWithValue("@Titulo", tarefa.Titulo);
                cmd.Parameters.AddWithValue("@Descricao", (object?)tarefa.Descricao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PrioridadeId", tarefa.PrioridadeId);
                cmd.Parameters.AddWithValue("@ColaboradorResponsavelId", (object?)tarefa.ColaboradorResponsavelId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DataHoraAtribuicao", (object?)tarefa.DataHoraAtribuicao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@EtapaId", (object?)tarefa.EtapaId ?? DBNull.Value);

                var result = await cmd.ExecuteScalarAsync();
                tarefa.Id = Convert.ToInt32(result);
                tarefa.ProjetoId = projetoId;
            }
        }

        private static async Task<IEnumerable<ProjetoTarefa>> ObterTarefasPorProjetoIdAsync(SqlConnection connection, int projetoId)
        {
            var tarefas = new List<ProjetoTarefa>();

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, ProjetoId, Titulo, Descricao, PrioridadeId, ColaboradorResponsavelId, DataHoraAtribuicao, EtapaId
                FROM ProjetoTarefa
                WHERE ProjetoId = @ProjetoId
                ORDER BY Id;
            ";
            cmd.Parameters.AddWithValue("@ProjetoId", projetoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                tarefas.Add(new ProjetoTarefa
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    ProjetoId = Convert.ToInt32(dr["ProjetoId"]),
                    Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                    Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                    PrioridadeId = Convert.ToInt32(dr["PrioridadeId"]),
                    ColaboradorResponsavelId = dr["ColaboradorResponsavelId"] == DBNull.Value
                        ? null
                        : Convert.ToInt32(dr["ColaboradorResponsavelId"]),
                    DataHoraAtribuicao = dr["DataHoraAtribuicao"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(dr["DataHoraAtribuicao"]),
                    EtapaId = dr["EtapaId"] == DBNull.Value
                        ? null
                        : Convert.ToInt32(dr["EtapaId"])
                });
            }

            return tarefas;
        }
    }
}
