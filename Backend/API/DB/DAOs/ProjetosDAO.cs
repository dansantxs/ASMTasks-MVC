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
                    (Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, Ativo, Concluido)
                    VALUES
                    (@Titulo, @Descricao, @ClienteId, @CadastradoPorColaboradorId, @DataCadastro, @Ativo, 0);
                    SELECT CAST(SCOPE_IDENTITY() AS int);
                ";

                cmd.Parameters.AddWithValue("@Titulo", projeto.Titulo);
                cmd.Parameters.AddWithValue("@Descricao", (object?)projeto.Descricao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@ClienteId", projeto.ClienteId);
                cmd.Parameters.AddWithValue("@CadastradoPorColaboradorId", projeto.CadastradoPorColaboradorId);
                cmd.Parameters.AddWithValue("@DataCadastro", projeto.DataCadastro);
                cmd.Parameters.AddWithValue("@Ativo", projeto.Ativo);

                var result = await cmd.ExecuteScalarAsync();
                projeto.Id = Convert.ToInt32(result);

                await InserirTarefasAsync(con, transaction, projeto.Id, projeto.Tarefas, projeto.CadastradoPorColaboradorId);
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
                            AlteradoPorColaboradorId = @AlteradoPorColaboradorId,
                            DataAlteracao = @DataAlteracao
                        WHERE Id = @Id;
                    ";

                    cmd.Parameters.AddWithValue("@Id", projeto.Id);
                    cmd.Parameters.AddWithValue("@Titulo", projeto.Titulo);
                    cmd.Parameters.AddWithValue("@Descricao", (object?)projeto.Descricao ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ClienteId", projeto.ClienteId);
                    cmd.Parameters.AddWithValue("@AlteradoPorColaboradorId", (object?)projeto.AlteradoPorColaboradorId ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@DataAlteracao", (object?)projeto.DataAlteracao ?? DBNull.Value);

                    var linhasProjeto = await cmd.ExecuteNonQueryAsync();
                    if (linhasProjeto == 0)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
                }

                // Obtém IDs das tarefas existentes no banco
                var existingIds = new List<int>();
                await using (var cmd = con.CreateCommand())
                {
                    cmd.Transaction = transaction;
                    cmd.CommandText = "SELECT Id FROM ProjetoTarefa WHERE ProjetoId = @ProjetoId";
                    cmd.Parameters.AddWithValue("@ProjetoId", projeto.Id);
                    await using var dr = await cmd.ExecuteReaderAsync();
                    while (await dr.ReadAsync())
                        existingIds.Add(Convert.ToInt32(dr["Id"]));
                }

                var requestedIds = projeto.Tarefas
                    .Where(t => t.Id > 0)
                    .Select(t => t.Id)
                    .ToHashSet();

                // Remove tarefas que foram excluídas do formulário
                var toDeleteIds = existingIds.Except(requestedIds).ToList();
                if (toDeleteIds.Count > 0)
                {
                    await using var deleteCmd = con.CreateCommand();
                    deleteCmd.Transaction = transaction;
                    deleteCmd.CommandText = $"DELETE FROM ProjetoTarefa WHERE Id IN ({string.Join(",", toDeleteIds)})";
                    await deleteCmd.ExecuteNonQueryAsync();
                }

                // Atualiza apenas Titulo/Descricao/PrioridadeId das tarefas existentes (preserva estado do Kanban)
                foreach (var tarefa in projeto.Tarefas.Where(t => t.Id > 0))
                {
                    await using var updateCmd = con.CreateCommand();
                    updateCmd.Transaction = transaction;
                    updateCmd.CommandText = @"
                        UPDATE ProjetoTarefa SET
                            Titulo = @Titulo,
                            Descricao = @Descricao,
                            PrioridadeId = @PrioridadeId,
                            SetorId = @SetorId,
                            TempoExecucaoValor = @TempoExecucaoValor,
                            TempoExecucaoUnidade = @TempoExecucaoUnidade,
                            TempoTesteValor = @TempoTesteValor,
                            TempoTesteUnidade = @TempoTesteUnidade
                        WHERE Id = @Id AND ProjetoId = @ProjetoId;
                    ";
                    updateCmd.Parameters.AddWithValue("@Id", tarefa.Id);
                    updateCmd.Parameters.AddWithValue("@ProjetoId", projeto.Id);
                    updateCmd.Parameters.AddWithValue("@Titulo", tarefa.Titulo);
                    updateCmd.Parameters.AddWithValue("@Descricao", (object?)tarefa.Descricao ?? DBNull.Value);
                    updateCmd.Parameters.AddWithValue("@PrioridadeId", tarefa.PrioridadeId);
                    updateCmd.Parameters.AddWithValue("@SetorId", (object?)tarefa.SetorId ?? DBNull.Value);
                    updateCmd.Parameters.AddWithValue("@TempoExecucaoValor", (object?)tarefa.TempoExecucaoValor ?? DBNull.Value);
                    updateCmd.Parameters.AddWithValue("@TempoExecucaoUnidade", (object?)tarefa.TempoExecucaoUnidade ?? DBNull.Value);
                    updateCmd.Parameters.AddWithValue("@TempoTesteValor", (object?)tarefa.TempoTesteValor ?? DBNull.Value);
                    updateCmd.Parameters.AddWithValue("@TempoTesteUnidade", (object?)tarefa.TempoTesteUnidade ?? DBNull.Value);
                    await updateCmd.ExecuteNonQueryAsync();
                }

                // Insere novas tarefas (sem Id) — o controller preenche CadastradoPorColaboradorId
                // com o usuario logado; o padrao aqui e apenas um fallback defensivo.
                var newTarefas = projeto.Tarefas.Where(t => t.Id <= 0).ToList();
                await InserirTarefasAsync(con, transaction, projeto.Id, newTarefas, projeto.CadastradoPorColaboradorId);

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
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, AlteradoPorColaboradorId, DataAlteracao, Ativo, Concluido
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
                        AlteradoPorColaboradorId = dr["AlteradoPorColaboradorId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["AlteradoPorColaboradorId"]),
                        DataAlteracao = dr["DataAlteracao"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(dr["DataAlteracao"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        Concluido = Convert.ToBoolean(dr["Concluido"])
                    });
                }
            }

            // Carrega as tarefas de TODOS os projetos em uma unica consulta e agrupa
            // em memoria, em vez de disparar uma consulta por projeto (N+1). Isso
            // reduz drasticamente o tempo do endpoint de listagem para clientes com
            // muitos projetos/lancamentos. O resultado e identico ao anterior.
            var tarefasPorProjeto = await ObterTarefasAgrupadasPorProjetoAsync(con);
            foreach (var projeto in lista)
                projeto.Tarefas = tarefasPorProjeto.TryGetValue(projeto.Id, out var tarefas)
                    ? tarefas
                    : new List<ProjetoTarefa>();

            return lista;
        }

        public async Task<Projeto?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            Projeto? projeto = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using (var cmd = con.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT Id, Titulo, Descricao, ClienteId, CadastradoPorColaboradorId, DataCadastro, AlteradoPorColaboradorId, DataAlteracao, Ativo, Concluido
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
                        AlteradoPorColaboradorId = dr["AlteradoPorColaboradorId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["AlteradoPorColaboradorId"]),
                        DataAlteracao = dr["DataAlteracao"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(dr["DataAlteracao"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        Concluido = Convert.ToBoolean(dr["Concluido"])
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
                SELECT pt.Id, pt.ProjetoId, pt.EtapaId, pt.ColaboradorResponsavelId, pt.DataHoraInicio,
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
                ProjetoId = Convert.ToInt32(dr["ProjetoId"]),
                EtapaId = dr["EtapaId"] == DBNull.Value ? null : Convert.ToInt32(dr["EtapaId"]),
                ColaboradorResponsavelId = dr["ColaboradorResponsavelId"] == DBNull.Value ? null : Convert.ToInt32(dr["ColaboradorResponsavelId"]),
                DataHoraInicio = dr["DataHoraInicio"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataHoraInicio"]),
            };
        }

        public async Task InserirHistoricoAsync(DBContext dbContext, ProjetoTarefaHistorico historico)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO ProjetoTarefaHistorico
                (TarefaId, Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, Observacao, DataHoraAcao,
                 RealizadoPorColaboradorId, RealizadoPorColaboradorNome)
                VALUES
                (@TarefaId, @Tipo, @ColaboradorId,
                 ISNULL(@ColaboradorNome, (SELECT Nome FROM Colaborador WHERE Id = @ColaboradorId)),
                 @EtapaId,
                 ISNULL(@EtapaNome, (SELECT Nome FROM Etapa WHERE Id = @EtapaId)),
                 @Observacao,
                 @DataHoraAcao,
                 @RealizadoPorColaboradorId,
                 ISNULL(@RealizadoPorColaboradorNome, (SELECT Nome FROM Colaborador WHERE Id = @RealizadoPorColaboradorId)));
            ";
            cmd.Parameters.AddWithValue("@TarefaId", historico.TarefaId);
            cmd.Parameters.AddWithValue("@Tipo", historico.Tipo.ToString());
            cmd.Parameters.AddWithValue("@ColaboradorId", (object?)historico.ColaboradorId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ColaboradorNome", (object?)historico.ColaboradorNome ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@EtapaId", (object?)historico.EtapaId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@EtapaNome", (object?)historico.EtapaNome ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Observacao", (object?)historico.Observacao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataHoraAcao", historico.DataHoraAcao);
            cmd.Parameters.AddWithValue("@RealizadoPorColaboradorId", (object?)historico.RealizadoPorColaboradorId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@RealizadoPorColaboradorNome", (object?)historico.RealizadoPorColaboradorNome ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task InserirHistoricoProjetoAsync(DBContext dbContext, ProjetoHistorico historico)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO ProjetoHistorico
                (ProjetoId, Tipo, RealizadoPorColaboradorId, RealizadoPorColaboradorNome, DataHoraAcao)
                VALUES
                (@ProjetoId, @Tipo, @RealizadoPorColaboradorId,
                 ISNULL(@RealizadoPorColaboradorNome, (SELECT Nome FROM Colaborador WHERE Id = @RealizadoPorColaboradorId)),
                 @DataHoraAcao);
            ";
            cmd.Parameters.AddWithValue("@ProjetoId", historico.ProjetoId);
            cmd.Parameters.AddWithValue("@Tipo", historico.Tipo.ToString());
            cmd.Parameters.AddWithValue("@RealizadoPorColaboradorId", (object?)historico.RealizadoPorColaboradorId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@RealizadoPorColaboradorNome", (object?)historico.RealizadoPorColaboradorNome ?? DBNull.Value);
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
                        WHERE ColaboradorResponsavelId = (
                            SELECT ColaboradorResponsavelId FROM ProjetoTarefa WHERE Id = @TarefaId
                        )
                        AND DataHoraInicio IS NOT NULL
                        AND Id != @TarefaId;
                    ";
                    checkCmd.Parameters.AddWithValue("@TarefaId", tarefaId);
                    var count = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                    if (count > 0)
                        throw new System.ComponentModel.DataAnnotations.ValidationException(
                            "O responsável já possui outra tarefa em andamento. Pause-a antes de iniciar esta.");
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
                         (SELECT pt.EtapaId FROM ProjetoTarefa pt WHERE pt.Id = @TarefaId),
                         (SELECT e.Nome FROM ProjetoTarefa pt LEFT JOIN Etapa e ON pt.EtapaId = e.Id WHERE pt.Id = @TarefaId),
                         @DataHoraAcao);
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
                         (SELECT pt.EtapaId FROM ProjetoTarefa pt WHERE pt.Id = @TarefaId),
                         (SELECT e.Nome FROM ProjetoTarefa pt LEFT JOIN Etapa e ON pt.EtapaId = e.Id WHERE pt.Id = @TarefaId),
                         @Observacao, @DataHoraAcao);
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

        public async Task<IEnumerable<int>> ObterTarefasEmAndamentoPorColaboradorAsync(DBContext dbContext, int colaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id FROM ProjetoTarefa
                WHERE ColaboradorResponsavelId = @ColaboradorId
                AND DataHoraInicio IS NOT NULL;
            ";
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            var ids = new List<int>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                ids.Add(reader.GetInt32(0));
            return ids;
        }

        public async Task<TarefaEmAndamentoResponse?> ObterTarefaEmAndamentoDetalhadaAsync(DBContext dbContext, int colaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT TOP 1 pt.Id, pt.Titulo, p.Titulo AS ProjetoTitulo, pt.DataHoraInicio
                FROM ProjetoTarefa pt
                INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                WHERE pt.ColaboradorResponsavelId = @ColaboradorId
                AND pt.DataHoraInicio IS NOT NULL
                ORDER BY pt.DataHoraInicio DESC;
            ";
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            await using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync())
                return null;

            return new TarefaEmAndamentoResponse
            {
                Id = reader.GetInt32(0),
                Titulo = reader.GetString(1),
                ProjetoTitulo = reader.GetString(2),
                DataHoraInicio = reader.GetDateTime(3)
            };
        }

        public async Task<IEnumerable<ProjetoTarefaHistoricoResponse>> ObterHistoricoTarefaAsync(DBContext dbContext, int tarefaId)
        {
            var lista = new List<ProjetoTarefaHistoricoResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, Observacao, DataHoraAcao,
                       RealizadoPorColaboradorId, RealizadoPorColaboradorNome
                FROM ProjetoTarefaHistorico
                WHERE TarefaId = @TarefaId
                ORDER BY DataHoraAcao DESC, Id DESC;
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
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"]),
                    RealizadoPorColaboradorId = dr["RealizadoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["RealizadoPorColaboradorId"]),
                    RealizadoPorColaboradorNome = dr["RealizadoPorColaboradorNome"] == DBNull.Value ? null : dr["RealizadoPorColaboradorNome"].ToString()
                });
            }

            return lista;
        }

        public async Task<(IEnumerable<TarefaHistoricoRelatorioResponse> Registros, int TotalTarefas)> ObterRelatorioHistoricoAsync(
            DBContext dbContext,
            char? tipo,
            int? colaboradorId,
            int? projetoId,
            int? clienteId,
            int? etapaId,
            DateTime? dataInicio,
            DateTime? dataFim,
            bool ultimaOcorrencia = false)
        {
            var lista = new List<TarefaHistoricoRelatorioResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();

            var filtros = new System.Text.StringBuilder("WHERE 1 = 1");
            if (tipo.HasValue)
            {
                filtros.Append(" AND h.Tipo = @Tipo");
                cmd.Parameters.AddWithValue("@Tipo", tipo.Value.ToString());
            }
            if (colaboradorId.HasValue)
            {
                filtros.Append(" AND h.ColaboradorId = @ColaboradorId");
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId.Value);
            }
            if (projetoId.HasValue)
            {
                filtros.Append(" AND p.Id = @ProjetoId");
                cmd.Parameters.AddWithValue("@ProjetoId", projetoId.Value);
            }
            if (clienteId.HasValue)
            {
                filtros.Append(" AND c.Id = @ClienteId");
                cmd.Parameters.AddWithValue("@ClienteId", clienteId.Value);
            }
            if (etapaId.HasValue)
            {
                filtros.Append(" AND h.EtapaId = @EtapaId");
                cmd.Parameters.AddWithValue("@EtapaId", etapaId.Value);
            }
            if (dataInicio.HasValue)
            {
                filtros.Append(" AND h.DataHoraAcao >= @DataInicio");
                cmd.Parameters.AddWithValue("@DataInicio", dataInicio.Value);
            }
            if (dataFim.HasValue)
            {
                filtros.Append(" AND h.DataHoraAcao <= @DataFim");
                cmd.Parameters.AddWithValue("@DataFim", dataFim.Value);
            }

            // Tempo REALIZADO por tarefa: minutos de elaboração (de um 'I' até o evento que a
            // encerra — pausa, fim da elaboração ou troca de etapa) e a parte desses minutos que
            // caiu dentro de uma passagem pela etapa de teste. Fica de fora do filtro de período
            // de propósito: a tarefa pode ter começado antes da janela consultada, e o relatório
            // quer o tempo inteiro dela. O LEAD é calculado ANTES de filtrar a etapa de teste,
            // senão o fim de uma passagem seria a próxima ida ao teste, não a saída dele.
            const string temposRealizados = @"
                LEFT JOIN (
                    SELECT ex.TarefaId, SUM(DATEDIFF(MINUTE, ex.Inicio, ex.Fim)) AS MinutosElaboracao
                    FROM (
                        SELECT he.TarefaId, he.Tipo, he.DataHoraAcao AS Inicio,
                               LEAD(he.DataHoraAcao) OVER (PARTITION BY he.TarefaId ORDER BY he.DataHoraAcao, he.Id) AS Fim
                        FROM ProjetoTarefaHistorico he
                        WHERE he.Tipo IN ('I', 'P', 'F', 'E')
                    ) ex
                    WHERE ex.Tipo = 'I' AND ex.Fim IS NOT NULL
                    GROUP BY ex.TarefaId
                ) elab ON elab.TarefaId = pt.Id
                LEFT JOIN (
                    SELECT ex.TarefaId,
                           SUM(DATEDIFF(MINUTE,
                               CASE WHEN ex.Inicio > te.Inicio THEN ex.Inicio ELSE te.Inicio END,
                               CASE WHEN ex.Fim < COALESCE(te.Fim, GETDATE()) THEN ex.Fim ELSE COALESCE(te.Fim, GETDATE()) END
                           )) AS MinutosTeste
                    FROM (
                        SELECT he.TarefaId, he.Tipo, he.DataHoraAcao AS Inicio,
                               LEAD(he.DataHoraAcao) OVER (PARTITION BY he.TarefaId ORDER BY he.DataHoraAcao, he.Id) AS Fim
                        FROM ProjetoTarefaHistorico he
                        WHERE he.Tipo IN ('I', 'P', 'F', 'E')
                    ) ex
                    INNER JOIN (
                        SELECT etapas.TarefaId, etapas.Inicio, etapas.Fim
                        FROM (
                            SELECT hs.TarefaId, hs.EtapaId, hs.DataHoraAcao AS Inicio,
                                   LEAD(hs.DataHoraAcao) OVER (PARTITION BY hs.TarefaId ORDER BY hs.DataHoraAcao, hs.Id) AS Fim
                            FROM ProjetoTarefaHistorico hs
                            WHERE hs.Tipo = 'E'
                        ) etapas
                        INNER JOIN Etapa et ON et.Id = etapas.EtapaId AND et.EhEtapaTeste = 1
                    ) te ON te.TarefaId = ex.TarefaId
                        AND ex.Inicio < COALESCE(te.Fim, GETDATE())
                        AND ex.Fim > te.Inicio
                    WHERE ex.Tipo = 'I' AND ex.Fim IS NOT NULL
                    GROUP BY ex.TarefaId
                ) teste ON teste.TarefaId = pt.Id
            ";

            // Tempo PREVISTO (o que está cadastrado na tarefa) + o realizado calculado acima.
            const string colunasTempos = @",
                    pt.TempoExecucaoValor,
                    pt.TempoExecucaoUnidade,
                    pt.TempoTesteValor,
                    pt.TempoTesteUnidade,
                    elab.MinutosElaboracao,
                    teste.MinutosTeste";

            string baseSelect = @"
                SELECT
                    h.Id,
                    h.TarefaId,
                    pt.Titulo AS TarefaTitulo,
                    pt.Descricao AS TarefaDescricao,
                    p.Id AS ProjetoId,
                    p.Titulo AS ProjetoTitulo,
                    c.Id AS ClienteId,
                    c.Nome AS ClienteNome,
                    c.NomeFantasia AS ClienteNomeFantasia,
                    h.Tipo,
                    h.ColaboradorId,
                    h.ColaboradorNome,
                    h.EtapaId,
                    h.EtapaNome,
                    h.Observacao,
                    h.DataHoraAcao,
                    h.RealizadoPorColaboradorId,
                    h.RealizadoPorColaboradorNome,
                    COALESCE(pt.CadastradoPorColaboradorId, p.CadastradoPorColaboradorId) AS CadastradoPorColaboradorId,
                    colCad.Nome AS CadastradoPorNome,
                    COALESCE(pt.DataCadastro, p.DataCadastro) AS TarefaDataCadastro" + colunasTempos + @"
                FROM ProjetoTarefaHistorico h
                INNER JOIN ProjetoTarefa pt ON h.TarefaId = pt.Id
                INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                INNER JOIN Cliente c ON p.ClienteId = c.Id
                LEFT JOIN Colaborador colCad ON colCad.Id = COALESCE(pt.CadastradoPorColaboradorId, p.CadastradoPorColaboradorId)
            " + temposRealizados;

            string sqlQuery;
            if (ultimaOcorrencia)
            {
                sqlQuery = $@"
                    WITH Ranked AS (
                        SELECT h.Id, h.TarefaId, pt.Titulo AS TarefaTitulo, pt.Descricao AS TarefaDescricao,
                               p.Id AS ProjetoId, p.Titulo AS ProjetoTitulo,
                               c.Id AS ClienteId, c.Nome AS ClienteNome, c.NomeFantasia AS ClienteNomeFantasia,
                               h.Tipo, h.ColaboradorId, h.ColaboradorNome,
                               h.EtapaId, h.EtapaNome, h.Observacao, h.DataHoraAcao,
                               h.RealizadoPorColaboradorId, h.RealizadoPorColaboradorNome,
                               COALESCE(pt.CadastradoPorColaboradorId, p.CadastradoPorColaboradorId) AS CadastradoPorColaboradorId,
                               colCad.Nome AS CadastradoPorNome,
                               COALESCE(pt.DataCadastro, p.DataCadastro) AS TarefaDataCadastro,
                               pt.TempoExecucaoValor, pt.TempoExecucaoUnidade,
                               pt.TempoTesteValor, pt.TempoTesteUnidade,
                               elab.MinutosElaboracao, teste.MinutosTeste,
                               ROW_NUMBER() OVER (PARTITION BY h.TarefaId, h.EtapaId ORDER BY h.DataHoraAcao DESC) AS rn
                        FROM ProjetoTarefaHistorico h
                        INNER JOIN ProjetoTarefa pt ON h.TarefaId = pt.Id
                        INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                        INNER JOIN Cliente c ON p.ClienteId = c.Id
                        LEFT JOIN Colaborador colCad ON colCad.Id = COALESCE(pt.CadastradoPorColaboradorId, p.CadastradoPorColaboradorId)
                        {temposRealizados}
                        {filtros}
                    )
                    SELECT Id, TarefaId, TarefaTitulo, TarefaDescricao, ProjetoId, ProjetoTitulo, ClienteId, ClienteNome, ClienteNomeFantasia,
                           Tipo, ColaboradorId, ColaboradorNome, EtapaId, EtapaNome, Observacao, DataHoraAcao,
                           RealizadoPorColaboradorId, RealizadoPorColaboradorNome,
                           CadastradoPorColaboradorId, CadastradoPorNome, TarefaDataCadastro,
                           TempoExecucaoValor, TempoExecucaoUnidade, TempoTesteValor, TempoTesteUnidade,
                           MinutosElaboracao, MinutosTeste
                    FROM Ranked WHERE rn = 1
                    ORDER BY DataHoraAcao DESC;
                ";
            }
            else
            {
                sqlQuery = baseSelect + filtros + " ORDER BY h.DataHoraAcao DESC;";
            }

            cmd.CommandText = sqlQuery;

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new TarefaHistoricoRelatorioResponse
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    TarefaId = Convert.ToInt32(dr["TarefaId"]),
                    TarefaTitulo = dr["TarefaTitulo"]?.ToString() ?? string.Empty,
                    TarefaDescricao = dr["TarefaDescricao"] == DBNull.Value ? null : dr["TarefaDescricao"].ToString(),
                    ProjetoId = Convert.ToInt32(dr["ProjetoId"]),
                    ProjetoTitulo = dr["ProjetoTitulo"]?.ToString() ?? string.Empty,
                    ClienteId = Convert.ToInt32(dr["ClienteId"]),
                    ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                    Tipo = Convert.ToString(dr["Tipo"])![0],
                    ColaboradorId = dr["ColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["ColaboradorId"]),
                    ColaboradorNome = dr["ColaboradorNome"] == DBNull.Value ? null : dr["ColaboradorNome"].ToString(),
                    EtapaId = dr["EtapaId"] == DBNull.Value ? null : Convert.ToInt32(dr["EtapaId"]),
                    EtapaNome = dr["EtapaNome"] == DBNull.Value ? null : dr["EtapaNome"].ToString(),
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"]),
                    RealizadoPorColaboradorId = dr["RealizadoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["RealizadoPorColaboradorId"]),
                    RealizadoPorColaboradorNome = dr["RealizadoPorColaboradorNome"] == DBNull.Value ? null : dr["RealizadoPorColaboradorNome"].ToString(),
                    Observacao = dr["Observacao"] == DBNull.Value ? null : dr["Observacao"].ToString(),
                    ClienteNomeFantasia = dr["ClienteNomeFantasia"] == DBNull.Value ? null : dr["ClienteNomeFantasia"].ToString(),
                    CadastradoPorColaboradorId = dr["CadastradoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["CadastradoPorColaboradorId"]),
                    CadastradoPorNome = dr["CadastradoPorNome"] == DBNull.Value ? null : dr["CadastradoPorNome"].ToString(),
                    TarefaDataCadastro = dr["TarefaDataCadastro"] == DBNull.Value ? null : Convert.ToDateTime(dr["TarefaDataCadastro"]),
                    TempoExecucaoValor = dr["TempoExecucaoValor"] == DBNull.Value ? null : Convert.ToInt32(dr["TempoExecucaoValor"]),
                    TempoExecucaoUnidade = dr["TempoExecucaoUnidade"] == DBNull.Value ? null : dr["TempoExecucaoUnidade"].ToString(),
                    TempoTesteValor = dr["TempoTesteValor"] == DBNull.Value ? null : Convert.ToInt32(dr["TempoTesteValor"]),
                    TempoTesteUnidade = dr["TempoTesteUnidade"] == DBNull.Value ? null : dr["TempoTesteUnidade"].ToString(),
                    MinutosElaboracao = dr["MinutosElaboracao"] == DBNull.Value ? null : Convert.ToInt32(dr["MinutosElaboracao"]),
                    MinutosTeste = dr["MinutosTeste"] == DBNull.Value ? null : Convert.ToInt32(dr["MinutosTeste"]),
                });
            }

            int totalTarefas = lista.Select(r => r.TarefaId).Distinct().Count();
            return (lista, totalTarefas);
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
                    pt.DataHoraInicio,
                    pt.SetorId,
                    COALESCE(pt.CadastradoPorColaboradorId, p.CadastradoPorColaboradorId) AS CadastradoPorColaboradorId,
                    colCad.Nome AS CadastradoPorNome,
                    COALESCE(pt.DataCadastro, p.DataCadastro) AS DataCadastro,
                    c.NomeFantasia AS ClienteNomeFantasia,
                    (SELECT COUNT(*) FROM ProjetoTarefaAnexo WHERE TarefaId = pt.Id) AS QuantidadeAnexos,
                    pt.TempoExecucaoValor,
                    pt.TempoExecucaoUnidade,
                    pt.TempoTesteValor,
                    pt.TempoTesteUnidade,
                    CASE
                        WHEN pt.DataHoraInicio IS NOT NULL THEN 'Em andamento'
                        WHEN EXISTS (
                            SELECT 1 FROM ProjetoTarefaHistorico h
                            WHERE h.TarefaId = pt.Id AND h.Tipo = 'P'
                            AND h.DataHoraAcao > COALESCE(
                                (SELECT MAX(h2.DataHoraAcao) FROM ProjetoTarefaHistorico h2
                                 WHERE h2.TarefaId = pt.Id AND h2.Tipo = 'E'),
                                '1900-01-01'
                            )
                        ) THEN 'Pausada'
                        ELSE 'Ociosa'
                    END AS StatusAtual
                FROM ProjetoTarefa pt
                INNER JOIN Projeto p ON pt.ProjetoId = p.Id
                INNER JOIN Cliente c ON p.ClienteId = c.Id
                INNER JOIN Prioridade pr ON pt.PrioridadeId = pr.Id
                LEFT JOIN Colaborador col ON pt.ColaboradorResponsavelId = col.Id
                LEFT JOIN Colaborador colCad ON colCad.Id = COALESCE(pt.CadastradoPorColaboradorId, p.CadastradoPorColaboradorId)
                WHERE p.Ativo = 1
                AND p.Concluido = 0
            ");

            if (!incluirBacklog)
                sql.Append(" AND pt.EtapaId IS NOT NULL");

            if (colaboradorIds != null && colaboradorIds.Length > 0)
            {
                // Id 0 é o sentinela do filtro "Sem responsável" (nunca existe em Colaborador,
                // que é IDENTITY a partir de 1) e vira IS NULL, já que IN (...) nunca casa com NULL
                var idsReais = colaboradorIds.Where(id => id != 0).ToArray();
                var incluirSemResponsavel = colaboradorIds.Contains(0);
                var condicoes = new List<string>();

                if (idsReais.Length > 0)
                {
                    var colParams = idsReais.Select((_, i) => $"@ColId{i}").ToList();
                    condicoes.Add($"pt.ColaboradorResponsavelId IN ({string.Join(",", colParams)})");
                    for (int i = 0; i < idsReais.Length; i++)
                        cmd.Parameters.AddWithValue($"@ColId{i}", idsReais[i]);
                }
                if (incluirSemResponsavel)
                    condicoes.Add("pt.ColaboradorResponsavelId IS NULL");

                if (condicoes.Count > 0)
                    sql.Append($" AND ({string.Join(" OR ", condicoes)})");
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
                        : Convert.ToDateTime(dr["DataHoraInicio"]),
                    SetorId = dr["SetorId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["SetorId"]),
                    CadastradoPorColaboradorId = dr["CadastradoPorColaboradorId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["CadastradoPorColaboradorId"]),
                    CadastradoPorNome = dr["CadastradoPorNome"] == DBNull.Value ? null : dr["CadastradoPorNome"].ToString(),
                    DataCadastro = dr["DataCadastro"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataCadastro"]),
                    QuantidadeAnexos = Convert.ToInt32(dr["QuantidadeAnexos"]),
                    ClienteNomeFantasia = dr["ClienteNomeFantasia"] == DBNull.Value ? null : dr["ClienteNomeFantasia"].ToString(),
                    TempoExecucaoValor = dr["TempoExecucaoValor"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["TempoExecucaoValor"]),
                    TempoExecucaoUnidade = dr["TempoExecucaoUnidade"] == DBNull.Value ? null : dr["TempoExecucaoUnidade"].ToString(),
                    TempoTesteValor = dr["TempoTesteValor"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["TempoTesteValor"]),
                    TempoTesteUnidade = dr["TempoTesteUnidade"] == DBNull.Value ? null : dr["TempoTesteUnidade"].ToString(),
                    StatusAtual = dr["StatusAtual"].ToString() ?? "Ociosa",
                });
            }

            return lista;
        }

        /// <summary>
        /// Atualiza o status de conclusão do projeto com base nas etapas das tarefas.
        /// Retorna true se o projeto acabou de ser marcado como concluído (transição 0 → 1).
        /// </summary>
        public async Task<bool> AtualizarStatusConclusaoProjetoAsync(DBContext dbContext, int tarefaId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                DECLARE @ProjetoId INT = (SELECT ProjetoId FROM ProjetoTarefa WHERE Id = @TarefaId);
                DECLARE @ConcluidoAntes BIT = (SELECT Concluido FROM Projeto WHERE Id = @ProjetoId);
                DECLARE @NovoStatus BIT = (
                    CASE WHEN (
                        SELECT COUNT(*) FROM ProjetoTarefa pt
                        WHERE pt.ProjetoId = @ProjetoId
                        AND (pt.EtapaId IS NULL OR NOT EXISTS (
                            SELECT 1 FROM Etapa e WHERE e.Id = pt.EtapaId AND e.EhEtapaFinal = 1
                        ))
                    ) = 0 THEN 1 ELSE 0 END
                );

                UPDATE Projeto SET Concluido = @NovoStatus WHERE Id = @ProjetoId;

                SELECT CASE WHEN @ConcluidoAntes = 0 AND @NovoStatus = 1 THEN 1 ELSE 0 END;
            ";
            cmd.Parameters.AddWithValue("@TarefaId", tarefaId);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) == 1;
        }

        public async Task DesmarcarConclusaoProjetoAsync(DBContext dbContext, int projetoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Projeto SET Concluido = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", projetoId);
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

        public async Task<IEnumerable<ProjetoHistoricoResponse>> ObterHistoricoProjetoAsync(DBContext dbContext, int projetoId)
        {
            var lista = new List<ProjetoHistoricoResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Tipo, RealizadoPorColaboradorId, RealizadoPorColaboradorNome, DataHoraAcao
                FROM ProjetoHistorico
                WHERE ProjetoId = @ProjetoId
                ORDER BY DataHoraAcao DESC;
            ";
            cmd.Parameters.AddWithValue("@ProjetoId", projetoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new ProjetoHistoricoResponse
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Tipo = Convert.ToString(dr["Tipo"])![0],
                    RealizadoPorColaboradorId = dr["RealizadoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["RealizadoPorColaboradorId"]),
                    RealizadoPorColaboradorNome = dr["RealizadoPorColaboradorNome"] == DBNull.Value ? null : dr["RealizadoPorColaboradorNome"].ToString(),
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"]),
                });
            }

            return lista;
        }

        public async Task<IEnumerable<ProjetoHistoricoRelatorioResponse>> ObterRelatorioHistoricoProjetoAsync(
            DBContext dbContext,
            char? tipo,
            int? projetoId,
            int? clienteId,
            int? colaboradorId,
            DateTime? dataInicio,
            DateTime? dataFim)
        {
            var lista = new List<ProjetoHistoricoRelatorioResponse>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();

            var sql = new System.Text.StringBuilder(@"
                SELECT
                    h.Id,
                    h.ProjetoId,
                    p.Titulo AS ProjetoTitulo,
                    c.Id AS ClienteId,
                    c.Nome AS ClienteNome,
                    c.NomeFantasia AS ClienteNomeFantasia,
                    h.Tipo,
                    h.RealizadoPorColaboradorId,
                    h.RealizadoPorColaboradorNome,
                    h.DataHoraAcao
                FROM ProjetoHistorico h
                INNER JOIN Projeto p ON h.ProjetoId = p.Id
                INNER JOIN Cliente c ON p.ClienteId = c.Id
                WHERE 1 = 1
            ");

            if (tipo.HasValue)
            {
                sql.Append(" AND h.Tipo = @Tipo");
                cmd.Parameters.AddWithValue("@Tipo", tipo.Value.ToString());
            }

            if (projetoId.HasValue)
            {
                sql.Append(" AND h.ProjetoId = @ProjetoId");
                cmd.Parameters.AddWithValue("@ProjetoId", projetoId.Value);
            }

            if (clienteId.HasValue)
            {
                sql.Append(" AND c.Id = @ClienteId");
                cmd.Parameters.AddWithValue("@ClienteId", clienteId.Value);
            }

            if (colaboradorId.HasValue)
            {
                sql.Append(" AND h.RealizadoPorColaboradorId = @ColaboradorId");
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId.Value);
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
                lista.Add(new ProjetoHistoricoRelatorioResponse
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    ProjetoId = Convert.ToInt32(dr["ProjetoId"]),
                    ProjetoTitulo = dr["ProjetoTitulo"]?.ToString() ?? string.Empty,
                    ClienteId = Convert.ToInt32(dr["ClienteId"]),
                    ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                    Tipo = Convert.ToString(dr["Tipo"])![0],
                    RealizadoPorColaboradorId = dr["RealizadoPorColaboradorId"] == DBNull.Value ? null : Convert.ToInt32(dr["RealizadoPorColaboradorId"]),
                    RealizadoPorColaboradorNome = dr["RealizadoPorColaboradorNome"] == DBNull.Value ? null : dr["RealizadoPorColaboradorNome"].ToString(),
                    DataHoraAcao = Convert.ToDateTime(dr["DataHoraAcao"]),
                    ClienteNomeFantasia = dr["ClienteNomeFantasia"] == DBNull.Value ? null : dr["ClienteNomeFantasia"].ToString(),
                });
            }

            return lista;
        }

        private static async Task InserirTarefasAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int projetoId,
            IEnumerable<ProjetoTarefa> tarefas,
            int cadastradoPorColaboradorIdPadrao)
        {
            foreach (var tarefa in tarefas)
            {
                await using var cmd = connection.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO ProjetoTarefa
                    (ProjetoId, Titulo, Descricao, PrioridadeId, ColaboradorResponsavelId, DataHoraAtribuicao, EtapaId, SetorId, CadastradoPorColaboradorId, DataCadastro, TempoExecucaoValor, TempoExecucaoUnidade, TempoTesteValor, TempoTesteUnidade)
                    VALUES
                    (@ProjetoId, @Titulo, @Descricao, @PrioridadeId, @ColaboradorResponsavelId, @DataHoraAtribuicao, @EtapaId, @SetorId, @CadastradoPorColaboradorId, SYSDATETIME(), @TempoExecucaoValor, @TempoExecucaoUnidade, @TempoTesteValor, @TempoTesteUnidade);
                    SELECT CAST(SCOPE_IDENTITY() AS int);
                ";

                cmd.Parameters.AddWithValue("@ProjetoId", projetoId);
                cmd.Parameters.AddWithValue("@CadastradoPorColaboradorId", (object?)(tarefa.CadastradoPorColaboradorId ?? cadastradoPorColaboradorIdPadrao) ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Titulo", tarefa.Titulo);
                cmd.Parameters.AddWithValue("@Descricao", (object?)tarefa.Descricao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PrioridadeId", tarefa.PrioridadeId);
                cmd.Parameters.AddWithValue("@ColaboradorResponsavelId", (object?)tarefa.ColaboradorResponsavelId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@DataHoraAtribuicao", (object?)tarefa.DataHoraAtribuicao ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@EtapaId", (object?)tarefa.EtapaId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@SetorId", (object?)tarefa.SetorId ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TempoExecucaoValor", (object?)tarefa.TempoExecucaoValor ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TempoExecucaoUnidade", (object?)tarefa.TempoExecucaoUnidade ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TempoTesteValor", (object?)tarefa.TempoTesteValor ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@TempoTesteUnidade", (object?)tarefa.TempoTesteUnidade ?? DBNull.Value);

                var result = await cmd.ExecuteScalarAsync();
                tarefa.Id = Convert.ToInt32(result);
                tarefa.ProjetoId = projetoId;
            }
        }

        // Versao em lote: retorna as tarefas de todos os projetos agrupadas por
        // ProjetoId, com uma unica ida ao banco (evita o N+1 em ObterTodosAsync).
        private static async Task<Dictionary<int, List<ProjetoTarefa>>> ObterTarefasAgrupadasPorProjetoAsync(SqlConnection connection)
        {
            var mapa = new Dictionary<int, List<ProjetoTarefa>>();

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, ProjetoId, Titulo, Descricao, PrioridadeId, ColaboradorResponsavelId, DataHoraAtribuicao, EtapaId, DataHoraInicio, SetorId,
                       TempoExecucaoValor, TempoExecucaoUnidade, TempoTesteValor, TempoTesteUnidade,
                       (SELECT COUNT(*) FROM ProjetoTarefaAnexo WHERE TarefaId = pt.Id) AS QuantidadeAnexos
                FROM ProjetoTarefa pt
                ORDER BY pt.ProjetoId, pt.Id;
            ";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                var tarefa = new ProjetoTarefa
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
                        : Convert.ToDateTime(dr["DataHoraInicio"]),
                    SetorId = dr["SetorId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["SetorId"]),
                    QuantidadeAnexos = Convert.ToInt32(dr["QuantidadeAnexos"]),
                    TempoExecucaoValor = dr["TempoExecucaoValor"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["TempoExecucaoValor"]),
                    TempoExecucaoUnidade = dr["TempoExecucaoUnidade"] == DBNull.Value ? null : dr["TempoExecucaoUnidade"].ToString(),
                    TempoTesteValor = dr["TempoTesteValor"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["TempoTesteValor"]),
                    TempoTesteUnidade = dr["TempoTesteUnidade"] == DBNull.Value ? null : dr["TempoTesteUnidade"].ToString()
                };

                if (!mapa.TryGetValue(tarefa.ProjetoId, out var bucket))
                {
                    bucket = new List<ProjetoTarefa>();
                    mapa[tarefa.ProjetoId] = bucket;
                }
                bucket.Add(tarefa);
            }

            return mapa;
        }

        private static async Task<IEnumerable<ProjetoTarefa>> ObterTarefasPorProjetoIdAsync(SqlConnection connection, int projetoId)
        {
            var tarefas = new List<ProjetoTarefa>();

            await using var cmd = connection.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, ProjetoId, Titulo, Descricao, PrioridadeId, ColaboradorResponsavelId, DataHoraAtribuicao, EtapaId, DataHoraInicio, SetorId,
                       TempoExecucaoValor, TempoExecucaoUnidade, TempoTesteValor, TempoTesteUnidade,
                       (SELECT COUNT(*) FROM ProjetoTarefaAnexo WHERE TarefaId = pt.Id) AS QuantidadeAnexos
                FROM ProjetoTarefa pt
                WHERE ProjetoId = @ProjetoId
                ORDER BY pt.Id;
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
                        : Convert.ToDateTime(dr["DataHoraInicio"]),
                    SetorId = dr["SetorId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["SetorId"]),
                    QuantidadeAnexos = Convert.ToInt32(dr["QuantidadeAnexos"]),
                    TempoExecucaoValor = dr["TempoExecucaoValor"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["TempoExecucaoValor"]),
                    TempoExecucaoUnidade = dr["TempoExecucaoUnidade"] == DBNull.Value ? null : dr["TempoExecucaoUnidade"].ToString(),
                    TempoTesteValor = dr["TempoTesteValor"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["TempoTesteValor"]),
                    TempoTesteUnidade = dr["TempoTesteUnidade"] == DBNull.Value ? null : dr["TempoTesteUnidade"].ToString()
                });
            }

            return tarefas;
        }

        public async Task<int> InserirAnexoAsync(DBContext dbContext, ProjetoTarefaAnexo anexo)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO ProjetoTarefaAnexo
                (TarefaId, NomeOriginal, ContentType, Tamanho, DataUpload, EnviadoPorColaboradorId, Conteudo)
                VALUES
                (@TarefaId, @NomeOriginal, @ContentType, @Tamanho, @DataUpload, @EnviadoPorColaboradorId, @Conteudo);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";
            cmd.Parameters.AddWithValue("@TarefaId", anexo.TarefaId);
            cmd.Parameters.AddWithValue("@NomeOriginal", anexo.NomeOriginal);
            cmd.Parameters.AddWithValue("@ContentType", anexo.ContentType);
            cmd.Parameters.AddWithValue("@Tamanho", anexo.Tamanho);
            cmd.Parameters.AddWithValue("@DataUpload", anexo.DataUpload);
            cmd.Parameters.AddWithValue("@EnviadoPorColaboradorId", anexo.EnviadoPorColaboradorId);
            cmd.Parameters.AddWithValue("@Conteudo", anexo.Conteudo);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        public async Task<IEnumerable<ProjetoTarefaAnexo>> ObterAnexosTarefaAsync(DBContext dbContext, int tarefaId)
        {
            var lista = new List<ProjetoTarefaAnexo>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, TarefaId, NomeOriginal, ContentType, Tamanho, DataUpload, EnviadoPorColaboradorId
                FROM ProjetoTarefaAnexo
                WHERE TarefaId = @TarefaId
                ORDER BY DataUpload ASC;
            ";
            cmd.Parameters.AddWithValue("@TarefaId", tarefaId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new ProjetoTarefaAnexo
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    TarefaId = Convert.ToInt32(dr["TarefaId"]),
                    NomeOriginal = dr["NomeOriginal"].ToString()!,
                    ContentType = dr["ContentType"].ToString()!,
                    Tamanho = Convert.ToInt64(dr["Tamanho"]),
                    DataUpload = Convert.ToDateTime(dr["DataUpload"]),
                    EnviadoPorColaboradorId = Convert.ToInt32(dr["EnviadoPorColaboradorId"])
                });
            }

            return lista;
        }

        public async Task<ProjetoTarefaAnexo?> ObterAnexoPorIdAsync(DBContext dbContext, int anexoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, TarefaId, NomeOriginal, ContentType, Tamanho, DataUpload, EnviadoPorColaboradorId
                FROM ProjetoTarefaAnexo
                WHERE Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", anexoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (!await dr.ReadAsync()) return null;

            return new ProjetoTarefaAnexo
            {
                Id = Convert.ToInt32(dr["Id"]),
                TarefaId = Convert.ToInt32(dr["TarefaId"]),
                NomeOriginal = dr["NomeOriginal"].ToString()!,
                ContentType = dr["ContentType"].ToString()!,
                Tamanho = Convert.ToInt64(dr["Tamanho"]),
                DataUpload = Convert.ToDateTime(dr["DataUpload"]),
                EnviadoPorColaboradorId = Convert.ToInt32(dr["EnviadoPorColaboradorId"])
            };
        }

        public async Task<byte[]?> ObterConteudoAnexoAsync(DBContext dbContext, int anexoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Conteudo FROM ProjetoTarefaAnexo WHERE Id = @Id;";
            cmd.Parameters.AddWithValue("@Id", anexoId);

            var result = await cmd.ExecuteScalarAsync();
            return result is DBNull || result is null ? null : (byte[])result;
        }

        public async Task CopiarAnexosTarefaAsync(DBContext dbContext, int tarefaIdOriginal, int novaTarefaId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO ProjetoTarefaAnexo
                (TarefaId, NomeOriginal, ContentType, Tamanho, DataUpload, EnviadoPorColaboradorId, Conteudo)
                SELECT @NovaTarefaId, NomeOriginal, ContentType, Tamanho, DataUpload, EnviadoPorColaboradorId, Conteudo
                FROM ProjetoTarefaAnexo
                WHERE TarefaId = @TarefaIdOriginal;
            ";
            cmd.Parameters.AddWithValue("@NovaTarefaId", novaTarefaId);
            cmd.Parameters.AddWithValue("@TarefaIdOriginal", tarefaIdOriginal);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<bool> DeletarAnexoAsync(DBContext dbContext, int anexoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "DELETE FROM ProjetoTarefaAnexo WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", anexoId);

            var linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> TarefaExisteAsync(DBContext dbContext, int tarefaId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT COUNT(1) FROM ProjetoTarefa WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", tarefaId);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        public async Task<bool> AnexoAcessivelParaColaboradorAsync(DBContext dbContext, int anexoId, int colaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM ProjetoTarefaAnexo a
                JOIN ProjetoTarefa t ON a.TarefaId = t.Id
                WHERE a.Id = @AnexoId
                AND (a.EnviadoPorColaboradorId = @ColaboradorId OR t.ColaboradorResponsavelId = @ColaboradorId);
            ";
            cmd.Parameters.AddWithValue("@AnexoId", anexoId);
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        public async Task<ProjetoDocumentoResponse?> ObterDocumentoAsync(DBContext dbContext, int projetoId)
        {
            ProjetoDocumentoResponse? doc = null;

            await using var con = await dbContext.GetConnectionAsync();

            await using (var cmd = con.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT
                        p.Id,
                        p.Titulo,
                        p.Descricao,
                        p.DataCadastro,
                        p.Ativo,
                        p.Concluido,
                        col.Nome AS CadastradoPorNome,
                        c.Id    AS ClienteId,
                        c.Nome  AS ClienteNome,
                        c.Documento AS ClienteDocumento,
                        c.TipoPessoa AS ClienteTipoPessoa,
                        c.Email AS ClienteEmail,
                        c.Telefone AS ClienteTelefone,
                        c.Cidade AS ClienteCidade,
                        c.UF AS ClienteUf,
                        c.Logradouro AS ClienteLogradouro,
                        c.Bairro AS ClienteBairro,
                        c.Numero AS ClienteNumero,
                        c.CEP AS ClienteCep
                    FROM Projeto p
                    INNER JOIN Colaborador col ON p.CadastradoPorColaboradorId = col.Id
                    INNER JOIN Cliente c ON p.ClienteId = c.Id
                    WHERE p.Id = @ProjetoId;
                ";
                cmd.Parameters.AddWithValue("@ProjetoId", projetoId);

                await using var dr = await cmd.ExecuteReaderAsync();
                if (await dr.ReadAsync())
                {
                    doc = new ProjetoDocumentoResponse
                    {
                        Id = Convert.ToInt32(dr["Id"]),
                        Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                        Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                        DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        Concluido = Convert.ToBoolean(dr["Concluido"]),
                        CadastradoPorNome = dr["CadastradoPorNome"]?.ToString() ?? string.Empty,
                        ClienteId = Convert.ToInt32(dr["ClienteId"]),
                        ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                        ClienteDocumento = dr["ClienteDocumento"]?.ToString() ?? string.Empty,
                        ClienteTipoPessoa = dr["ClienteTipoPessoa"]?.ToString() ?? string.Empty,
                        ClienteEmail = dr["ClienteEmail"] == DBNull.Value ? null : dr["ClienteEmail"].ToString(),
                        ClienteTelefone = dr["ClienteTelefone"] == DBNull.Value ? null : dr["ClienteTelefone"].ToString(),
                        ClienteCidade = dr["ClienteCidade"] == DBNull.Value ? null : dr["ClienteCidade"].ToString(),
                        ClienteUf = dr["ClienteUf"] == DBNull.Value ? null : dr["ClienteUf"].ToString(),
                        ClienteLogradouro = dr["ClienteLogradouro"] == DBNull.Value ? null : dr["ClienteLogradouro"].ToString(),
                        ClienteBairro = dr["ClienteBairro"] == DBNull.Value ? null : dr["ClienteBairro"].ToString(),
                        ClienteNumero = dr["ClienteNumero"] == DBNull.Value ? null : Convert.ToInt32(dr["ClienteNumero"]),
                        ClienteCep = dr["ClienteCep"] == DBNull.Value ? null : dr["ClienteCep"].ToString(),
                    };
                }
            }

            if (doc == null) return null;

            await using (var cmd = con.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT
                        pt.Id,
                        pt.Titulo,
                        pt.Descricao,
                        pr.Nome AS PrioridadeNome,
                        pr.Cor  AS PrioridadeCor,
                        col.Nome AS ColaboradorResponsavelNome,
                        e.Nome AS EtapaNome,
                        s.Nome AS SetorNome
                    FROM ProjetoTarefa pt
                    INNER JOIN Prioridade pr ON pt.PrioridadeId = pr.Id
                    LEFT JOIN Colaborador col ON pt.ColaboradorResponsavelId = col.Id
                    LEFT JOIN Etapa e ON pt.EtapaId = e.Id
                    LEFT JOIN Setor s ON pt.SetorId = s.Id
                    WHERE pt.ProjetoId = @ProjetoId
                    ORDER BY pr.Ordem, pt.Id;
                ";
                cmd.Parameters.AddWithValue("@ProjetoId", projetoId);

                await using var dr = await cmd.ExecuteReaderAsync();
                while (await dr.ReadAsync())
                {
                    doc.Tarefas.Add(new ProjetoDocumentoTarefaResponse
                    {
                        Id = Convert.ToInt32(dr["Id"]),
                        Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                        Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                        PrioridadeNome = dr["PrioridadeNome"]?.ToString() ?? string.Empty,
                        PrioridadeCor = dr["PrioridadeCor"] == DBNull.Value ? null : dr["PrioridadeCor"].ToString(),
                        ColaboradorResponsavelNome = dr["ColaboradorResponsavelNome"] == DBNull.Value ? null : dr["ColaboradorResponsavelNome"].ToString(),
                        EtapaNome = dr["EtapaNome"] == DBNull.Value ? null : dr["EtapaNome"].ToString(),
                        SetorNome = dr["SetorNome"] == DBNull.Value ? null : dr["SetorNome"].ToString(),
                    });
                }
            }

            return doc;
        }
    }
}
