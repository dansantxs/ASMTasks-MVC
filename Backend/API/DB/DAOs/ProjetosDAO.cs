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
                    (Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, Concluido, SetorId)
                    VALUES
                    (@Titulo, @Descricao, @ClienteId, @CadastradoPorColaboradorId, @DataCadastro, @Ativo, 0, @SetorId);
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
                            SetorId = @SetorId,
                            Concluido = 0
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
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, Concluido, SetorId
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
                        Concluido = Convert.ToBoolean(dr["Concluido"]),
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
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, Concluido, SetorId
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
                        Concluido = Convert.ToBoolean(dr["Concluido"]),
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
                    DataHoraAtribuicao = @DataHoraAtribuicao,
                    DataHoraInicio = NULL
                WHERE Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", tarefaId);
            cmd.Parameters.AddWithValue("@EtapaId", (object?)etapaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ColaboradorResponsavelId", (object?)colaboradorResponsavelId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataHoraAtribuicao", (object?)dataHoraAtribuicao ?? DBNull.Value);

            var linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> AtualizarColaboradorTarefaAsync(
            DBContext dbContext,
            int tarefaId,
            int? colaboradorResponsavelId,
            DateTime? dataHoraAtribuicao)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE ProjetoTarefa
                SET ColaboradorResponsavelId = @ColaboradorResponsavelId,
                    DataHoraAtribuicao = @DataHoraAtribuicao,
                    DataHoraInicio = NULL
                WHERE Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", tarefaId);
            cmd.Parameters.AddWithValue("@ColaboradorResponsavelId", (object?)colaboradorResponsavelId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataHoraAtribuicao", (object?)dataHoraAtribuicao ?? DBNull.Value);

            var linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<ProjetoTarefa?> ObterEstadoAtualTarefaAsync(DBContext dbContext, int tarefaId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT pt.Id, pt.EtapaId, pt.ColaboradorResponsavelId, pt.DataHoraInicio,
                       col.Nome AS ColaboradorNome, e.Nome AS EtapaNome
                FROM ProjetoTarefa pt
                LEFT JOIN Colaborador col ON pt.ColaboradorResponsavelId = col.Id
                LEFT JOIN Etapa e ON pt.EtapaId = e.Id
                WHERE pt.Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", tarefaId);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (!await dr.ReadAsync()) return null;

            return new ProjetoTarefa
            {
                Id = Convert.ToInt32(dr["Id"]),
                EtapaId = dr["EtapaId"] == DBNull.Value ? null : Convert.ToInt32(dr["EtapaId"]),
                ColaboradorResponsavelId = dr["ColaboradorResponsavelId"] == DBNull.Value ? null : Convert.ToInt32(dr["ColaboradorResponsavelId"]),
                DataHoraInicio = dr["DataHoraInicio"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataHoraInicio"]),
                // Nomes usados apenas para contexto — não fazem parte do model real, mas o model aceita
            };
        }

        public async Task InserirHistoricoAsync(DBContext dbContext, ProjetoTarefaHistorico historico)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO ProjetoTarefaHistorico
                (TarefaId, Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, Observacao, DataHoraAcao)
                VALUES
                (@TarefaId, @Tipo, @ColaboradorId,
                 ISNULL(@ColaboradorNome, (SELECT Nome FROM Colaborador WHERE Id = @ColaboradorId)),
                 @EtapaId,
                 ISNULL(@EtapaNome, (SELECT Nome FROM Etapa WHERE Id = @EtapaId)),
                 @Observacao,
                 @DataHoraAcao);
            ";
            cmd.Parameters.AddWithValue("@TarefaId", historico.TarefaId);
            cmd.Parameters.AddWithValue("@Tipo", historico.Tipo.ToString());
            cmd.Parameters.AddWithValue("@ColaboradorId", (object?)historico.ColaboradorId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ColaboradorNome", (object?)historico.ColaboradorNome ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@EtapaId", (object?)historico.EtapaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@EtapaNome", (object?)historico.EtapaNome ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Observacao", (object?)historico.Observacao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataHoraAcao", historico.DataHoraAcao);

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<bool> IniciarTarefaAsync(DBContext dbContext, int tarefaId, int colaboradorId, DateTime dataHoraInicio)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                await using (var checkCmd = con.CreateCommand())
                {
                    checkCmd.Transaction = transaction;
                    checkCmd.CommandText = @"
                        SELECT COUNT(*) FROM ProjetoTarefa
                        WHERE ColaboradorResponsavelId = @ColaboradorId
                        AND DataHoraInicio IS NOT NULL
                        AND Id != @TarefaId;
                    ";
                    checkCmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
                    checkCmd.Parameters.AddWithValue("@TarefaId", tarefaId);
                    var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                    if (count > 0)
                    {
                        await transaction.RollbackAsync();
                        throw new System.ComponentModel.DataAnnotations.ValidationException(
                            "Você já possui outra tarefa em andamento. Pause-a antes de iniciar esta.");
                    }
                }

                await using (var cmd = con.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = @"
                        UPDATE ProjetoTarefa SET DataHoraInicio = @DataHoraInicio
                        WHERE Id = @Id AND DataHoraInicio IS NULL;
                    ";
                    cmd.Parameters.AddWithValue("@Id", tarefaId);
                    cmd.Parameters.AddWithValue("@DataHoraInicio", dataHoraInicio);

                    var linhas = await cmd.ExecuteNonQueryAsync();
                    if (linhas == 0)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
                }

                await using (var histCmd = con.CreateCommand())
                {
                    histCmd.Transaction = transaction;
                    histCmd.CommandText = @"
                        INSERT INTO ProjetoTarefaHistorico
                        (TarefaId, Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, DataHoraAcao)
                        VALUES
                        (@TarefaId, 'I', @ColaboradorId,
                         (SELECT Nome FROM Colaborador WHERE Id = @ColaboradorId),
                         NULL, NULL, @DataHoraAcao);
                    ";
                    histCmd.Parameters.AddWithValue("@TarefaId", tarefaId);
                    histCmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
                    histCmd.Parameters.AddWithValue("@DataHoraAcao", dataHoraInicio);

                    await histCmd.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> PausarTarefaAsync(DBContext dbContext, int tarefaId, int colaboradorId, DateTime dataHoraPausa, string? observacao = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var transaction = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                await using (var cmd = con.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = @"
                        UPDATE ProjetoTarefa SET DataHoraInicio = NULL
                        WHERE Id = @Id AND DataHoraInicio IS NOT NULL;
                    ";
                    cmd.Parameters.AddWithValue("@Id", tarefaId);

                    var linhas = await cmd.ExecuteNonQueryAsync();
                    if (linhas == 0)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
                }

                await using (var histCmd = con.CreateCommand())
                {
                    histCmd.Transaction = transaction;
                    histCmd.CommandText = @"
                        INSERT INTO ProjetoTarefaHistorico
                        (TarefaId, Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, Observacao, DataHoraAcao)
                        VALUES
                        (@TarefaId, 'P', @ColaboradorId,
                         (SELECT Nome FROM Colaborador WHERE Id = @ColaboradorId),
                         NULL, NULL, @Observacao, @DataHoraAcao);
                    ";
                    histCmd.Parameters.AddWithValue("@TarefaId", tarefaId);
                    histCmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
                    histCmd.Parameters.AddWithValue("@Observacao", (object?)observacao ?? DBNull.Value);
                    histCmd.Parameters.AddWithValue("@DataHoraAcao", dataHoraPausa);

                    await histCmd.ExecuteNonQueryAsync();
                }

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<ProjetoTarefaHistoricoResponse>> ObterHistoricoTarefaAsync(DBContext dbContext, int tarefaId)
        {
            var lista = new List<ProjetoTarefaHistoricoResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, Observacao, DataHoraAcao
                FROM ProjetoTarefaHistorico
                WHERE TarefaId = @TarefaId
                ORDER BY DataHoraAcao ASC;
            ";
            cmd.Parameters.AddWithValue("@TarefaId", tarefaId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new ProjetoTarefaHistoricoResponse
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Tipo = Convert.ToString(dr["Tipo"])![0],
                    ColaboradorId = dr["ColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["ColaboradorId"]),
                    ColaboradorNome = dr["ColaboradorNome"] == DBNull.Value ? null : dr["ColaboradorNome"].ToString(),
                    EtapaId = dr["EtapaId"] == DBNull.Value ? null : Convert.ToInt32(dr["EtapaId"]),
                    EtapaNome = dr["EtapaNome"] == DBNull.Value ? null : dr["EtapaNome"].ToString(),
                    Observacao = dr["Observacao"] == DBNull.Value ? null : dr["Observacao"].ToString(),
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"])
                });
            }

            return lista;
        }

        public async Task<IEnumerable<TarefaHistoricoRelatorioResponse>> ObterRelatorioHistoricoAsync(
            DBContext dbContext,
            char? tipo,
            int? colaboradorId,
            int? projetoId,
            int? clienteId,
            DateTime? dataInicio,
            DateTime? dataFim)
        {
            var lista = new List<TarefaHistoricoRelatorioResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();

            var sql = new System.Text.StringBuilder(@"
                SELECT
                    h.Id,
                    h.TarefaId,
                    pt.Titulo AS TarefaTitulo,
                    p.Id AS ProjetoId,
                    p.Titulo AS ProjetoTitulo,
                    c.Id AS ClienteId,
                    c.Nome AS ClienteNome,
                    h.Tipo,
                    h.ColaboradorId,
                    h.ColaboradorNome,
                    h.EtapaId,
                    h.EtapaNome,
                    h.DataHoraAcao
                FROM ProjetoTarefaHistorico h
                INNER JOIN ProjetoTarefa pt ON h.TarefaId = pt.Id
                INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                INNER JOIN Cliente c ON p.ClienteId = c.Id
                WHERE 1 = 1
            ");

            if (tipo.HasValue)
            {
                sql.Append(" AND h.Tipo = @Tipo");
                cmd.Parameters.AddWithValue("@Tipo", tipo.Value.ToString());
            }

            if (colaboradorId.HasValue)
            {
                sql.Append(" AND h.ColaboradorId = @ColaboradorId");
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId.Value);
            }

            if (projetoId.HasValue)
            {
                sql.Append(" AND p.Id = @ProjetoId");
                cmd.Parameters.AddWithValue("@ProjetoId", projetoId.Value);
            }

            if (clienteId.HasValue)
            {
                sql.Append(" AND c.Id = @ClienteId");
                cmd.Parameters.AddWithValue("@ClienteId", clienteId.Value);
            }

            if (dataInicio.HasValue)
            {
                sql.Append(" AND h.DataHoraAcao >= @DataInicio");
                cmd.Parameters.AddWithValue("@DataInicio", dataInicio.Value);
            }

            if (dataFim.HasValue)
            {
                sql.Append(" AND h.DataHoraAcao <= @DataFim");
                cmd.Parameters.AddWithValue("@DataFim", dataFim.Value);
            }

            sql.Append(" ORDER BY h.DataHoraAcao DESC;");
            cmd.CommandText = sql.ToString();

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new TarefaHistoricoRelatorioResponse
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    TarefaId = Convert.ToInt32(dr["TarefaId"]),
                    TarefaTitulo = dr["TarefaTitulo"]?.ToString() ?? string.Empty,
                    ProjetoId = Convert.ToInt32(dr["ProjetoId"]),
                    ProjetoTitulo = dr["ProjetoTitulo"]?.ToString() ?? string.Empty,
                    ClienteId = Convert.ToInt32(dr["ClienteId"]),
                    ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                    Tipo = Convert.ToString(dr["Tipo"])![0],
                    ColaboradorId = dr["ColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["ColaboradorId"]),
                    ColaboradorNome = dr["ColaboradorNome"] == DBNull.Value ? null : dr["ColaboradorNome"].ToString(),
                    EtapaId = dr["EtapaId"] == DBNull.Value ? null : Convert.ToInt32(dr["EtapaId"]),
                    EtapaNome = dr["EtapaNome"] == DBNull.Value ? null : dr["EtapaNome"].ToString(),
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"])
                });
            }

            return lista;
        }

        public async Task<IEnumerable<TarefaKanbanResponse>> ObterTarefasKanbanAsync(
            DBContext dbContext,
            int[] colaboradorIds,
            int[] projetoIds,
            int[] clienteIds,
            bool incluirBacklog = false)
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
                    pt.EtapaId,
                    pt.DataHoraInicio
                FROM ProjetoTarefa pt
                INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                INNER JOIN Cliente c ON p.ClienteId = c.Id
                INNER JOIN Prioridade pr ON pt.PrioridadeId = pr.Id
                LEFT JOIN Colaborador col ON pt.ColaboradorResponsavelId = col.Id
                WHERE p.Ativo = 1
                AND p.Concluido = 0
            ");

            if (!incluirBacklog)
                sql.Append(" AND pt.EtapaId IS NOT NULL");

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
                        : Convert.ToInt32(dr["EtapaId"]),
                    DataHoraInicio = dr["DataHoraInicio"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(dr["DataHoraInicio"])
                });
            }

            return lista;
        }

        public async Task AtualizarStatusConclusaoProjetoAsync(DBContext dbContext, int tarefaId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                DECLARE @ProjetoId INT = (SELECT ProjetoId FROM ProjetoTarefa WHERE Id = @TarefaId);

                UPDATE Projeto
                SET Concluido = (
                    CASE WHEN (
                        SELECT COUNT(*) FROM ProjetoTarefa pt
                        WHERE pt.ProjetoId = @ProjetoId
                        AND (pt.EtapaId IS NULL OR NOT EXISTS (
                            SELECT 1 FROM Etapa e WHERE e.Id = pt.EtapaId AND e.EhEtapaFinal = 1
                        ))
                    ) = 0 THEN 1 ELSE 0 END
                )
                WHERE Id = @ProjetoId;
            ";
            cmd.Parameters.AddWithValue("@TarefaId", tarefaId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<int?> ObterResponsavelTarefaAsync(DBContext dbContext, int tarefaId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT ColaboradorResponsavelId FROM ProjetoTarefa WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", tarefaId);

            var result = await cmd.ExecuteScalarAsync();
            if (result == null || result == DBNull.Value)
                return null;
            return Convert.ToInt32(result);
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
                SELECT Id, ProjetoId, Titulo, Descricao, PrioridadeId, ColaboradorResponsavelId, DataHoraAtribuicao, EtapaId, DataHoraInicio
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
                        : Convert.ToInt32(dr["EtapaId"]),
                    DataHoraInicio = dr["DataHoraInicio"] == DBNull.Value
                        ? null
                        : Convert.ToDateTime(dr["DataHoraInicio"])
                });
            }

            return tarefas;
        }
    }
}
