using API.DTOs.Projetos;
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

        public async Task<bool> AtualizarEtapaTarefaAsync(
            DBContext dbContext,
            int tarefaId,
            int? etapaId,
            int? colaboradorResponsavelId,
            DateTime? dataHoraAtribuicao)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE ProjetoTarefa
                SET EtapaId = @EtapaId,
                    ColaboradorResponsavelId = @ColaboradorResponsavelId,
                    DataHoraAtribuicao = @DataHoraAtribuicao
                WHERE Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", tarefaId);
            cmd.Parameters.AddWithValue("@EtapaId", (object?)etapaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ColaboradorResponsavelId", (object?)colaboradorResponsavelId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataHoraAtribuicao", (object?)dataHoraAtribuicao ?? DBNull.Value);

            var linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<TarefaKanbanResponse>> ObterTarefasKanbanAsync(
            DBContext dbContext,
            int[] colaboradorIds,
            int[] projetoIds,
            int[] clienteIds)
        {
            var lista = new List<TarefaKanbanResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();

            var sql = new System.Text.StringBuilder(@"
                SELECT
                    pt.Id,
                    pt.ProjetoId,
                    p.Titulo AS ProjetoTitulo,
                    p.ClienteId,
                    c.Nome AS ClienteNome,
                    pt.Titulo,
                    pt.Descricao,
                    pt.PrioridadeId,
                    pr.Nome AS PrioridadeNome,
                    pr.Cor AS PrioridadeCor,
                    pr.Ordem AS PrioridadeOrdem,
                    pt.ColaboradorResponsavelId,
                    col.Nome AS ColaboradorResponsavelNome,
                    pt.DataHoraAtribuicao,
                    pt.EtapaId
                FROM ProjetoTarefa pt
                INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                INNER JOIN Cliente c ON p.ClienteId = c.Id
                INNER JOIN Prioridade pr ON pt.PrioridadeId = pr.Id
                LEFT JOIN Colaborador col ON pt.ColaboradorResponsavelId = col.Id
                WHERE p.Ativo = 1
            ");

            if (colaboradorIds != null && colaboradorIds.Length > 0)
            {
                var colParams = colaboradorIds.Select((_, i) => $"@ColId{i}").ToList();
                sql.Append($" AND pt.ColaboradorResponsavelId IN ({string.Join(",", colParams)})");
                for (int i = 0; i < colaboradorIds.Length; i++)
                    cmd.Parameters.AddWithValue($"@ColId{i}", colaboradorIds[i]);
            }

            if (projetoIds != null && projetoIds.Length > 0)
            {
                var projParams = projetoIds.Select((_, i) => $"@ProjId{i}").ToList();
                sql.Append($" AND pt.ProjetoId IN ({string.Join(",", projParams)})");
                for (int i = 0; i < projetoIds.Length; i++)
                    cmd.Parameters.AddWithValue($"@ProjId{i}", projetoIds[i]);
            }

            if (clienteIds != null && clienteIds.Length > 0)
            {
                var cliParams = clienteIds.Select((_, i) => $"@CliId{i}").ToList();
                sql.Append($" AND p.ClienteId IN ({string.Join(",", cliParams)})");
                for (int i = 0; i < clienteIds.Length; i++)
                    cmd.Parameters.AddWithValue($"@CliId{i}", clienteIds[i]);
            }

            sql.Append(" ORDER BY pr.Ordem, pt.Id;");
            cmd.CommandText = sql.ToString();

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new TarefaKanbanResponse
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    ProjetoId = Convert.ToInt32(dr["ProjetoId"]),
                    ProjetoTitulo = dr["ProjetoTitulo"]?.ToString() ?? string.Empty,
                    ClienteId = Convert.ToInt32(dr["ClienteId"]),
                    ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                    Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                    Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                    PrioridadeId = Convert.ToInt32(dr["PrioridadeId"]),
                    PrioridadeNome = dr["PrioridadeNome"]?.ToString() ?? string.Empty,
                    PrioridadeCor = dr["PrioridadeCor"] == DBNull.Value ? null : dr["PrioridadeCor"].ToString(),
                    PrioridadeOrdem = Convert.ToInt32(dr["PrioridadeOrdem"]),
                    ColaboradorResponsavelId = dr["ColaboradorResponsavelId"] == DBNull.Value
                        ? null
                        : Convert.ToInt32(dr["ColaboradorResponsavelId"]),
                    ColaboradorResponsavelNome = dr["ColaboradorResponsavelNome"] == DBNull.Value
                        ? null
                        : dr["ColaboradorResponsavelNome"].ToString(),
                    DataHoraAtribuicao = dr["DataHoraAtribuicao"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(dr["DataHoraAtribuicao"]),
                    EtapaId = dr["EtapaId"] == DBNull.Value
                        ? null
                        : Convert.ToInt32(dr["EtapaId"])
                });
            }

            return lista;
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
