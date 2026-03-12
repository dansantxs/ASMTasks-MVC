using API.Models;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class NotificacoesDAO
    {
        public async Task<IEnumerable<NotificacaoPendenteAtendimento>> ObterPendentesParaEnvioAsync(
            DBContext dbContext,
            DateTime janelaInicio,
            DateTime janelaFim,
            int limite)
        {
            var itens = new List<NotificacaoPendenteAtendimento>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT TOP (@Limite)
                    destinatario.ColaboradorId,
                    c.Nome AS ColaboradorNome,
                    c.Email AS ColaboradorEmail,
                    a.Id AS AtendimentoId,
                    a.Titulo AS AtendimentoTitulo,
                    cl.Nome AS ClienteNome,
                    a.DataHoraInicio,
                    an.MinutosAntecedencia,
                    DATEADD(MINUTE, -an.MinutosAntecedencia, a.DataHoraInicio) AS DataNotificacaoPrevista
                FROM Atendimento a
                INNER JOIN AtendimentoNotificacao an ON an.AtendimentoId = a.Id
                INNER JOIN Cliente cl ON cl.Id = a.ClienteId
                INNER JOIN (
                    SELECT ac.AtendimentoId, ac.ColaboradorId
                    FROM AtendimentoColaborador ac
                    UNION
                    SELECT at.Id AS AtendimentoId, at.CadastradoPorColaboradorId AS ColaboradorId
                    FROM Atendimento at
                ) destinatario ON destinatario.AtendimentoId = a.Id
                INNER JOIN Colaborador c ON c.Id = destinatario.ColaboradorId
                WHERE a.Ativo = 1
                  AND a.Status = 'A'
                  AND c.Ativo = 1
                  AND DATEADD(MINUTE, -an.MinutosAntecedencia, a.DataHoraInicio) >= @JanelaInicio
                  AND DATEADD(MINUTE, -an.MinutosAntecedencia, a.DataHoraInicio) < @JanelaFim
                  AND NOT EXISTS (
                      SELECT 1
                      FROM NotificacaoSistema ns
                      WHERE ns.AtendimentoId = a.Id
                        AND ns.ColaboradorId = destinatario.ColaboradorId
                        AND ns.MinutosAntecedencia = an.MinutosAntecedencia
                        AND ABS(DATEDIFF(MINUTE, ns.DataNotificacao, DATEADD(MINUTE, -an.MinutosAntecedencia, a.DataHoraInicio))) <= 2
                  )
                ORDER BY DataNotificacaoPrevista, a.DataHoraInicio, a.Id;";

            cmd.Parameters.AddWithValue("@Limite", Math.Clamp(limite, 1, 500));
            cmd.Parameters.AddWithValue("@JanelaInicio", janelaInicio);
            cmd.Parameters.AddWithValue("@JanelaFim", janelaFim);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                itens.Add(new NotificacaoPendenteAtendimento
                {
                    ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                    ColaboradorNome = dr["ColaboradorNome"]?.ToString() ?? string.Empty,
                    ColaboradorEmail = dr["ColaboradorEmail"] == DBNull.Value ? null : dr["ColaboradorEmail"].ToString(),
                    AtendimentoId = Convert.ToInt32(dr["AtendimentoId"]),
                    AtendimentoTitulo = dr["AtendimentoTitulo"]?.ToString() ?? string.Empty,
                    ClienteNome = dr["ClienteNome"]?.ToString() ?? string.Empty,
                    DataHoraInicio = Convert.ToDateTime(dr["DataHoraInicio"]),
                    MinutosAntecedencia = Convert.ToInt32(dr["MinutosAntecedencia"]),
                    DataNotificacaoPrevista = Convert.ToDateTime(dr["DataNotificacaoPrevista"])
                });
            }

            return itens;
        }

        public async Task<int> InserirNotificacaoSistemaAsync(DBContext dbContext, NotificacaoSistema notificacao)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO NotificacaoSistema
                (ColaboradorId, AtendimentoId, MinutosAntecedencia, Titulo, Mensagem, DataNotificacao, Lida, DataLeitura, DataCadastro)
                VALUES
                (@ColaboradorId, @AtendimentoId, @MinutosAntecedencia, @Titulo, @Mensagem, @DataNotificacao, @Lida, @DataLeitura, @DataCadastro);
                SELECT CAST(SCOPE_IDENTITY() AS int);";

            cmd.Parameters.AddWithValue("@ColaboradorId", notificacao.ColaboradorId);
            cmd.Parameters.AddWithValue("@AtendimentoId", notificacao.AtendimentoId);
            cmd.Parameters.AddWithValue("@MinutosAntecedencia", notificacao.MinutosAntecedencia);
            cmd.Parameters.AddWithValue("@Titulo", notificacao.Titulo);
            cmd.Parameters.AddWithValue("@Mensagem", notificacao.Mensagem);
            cmd.Parameters.AddWithValue("@DataNotificacao", notificacao.DataNotificacao);
            cmd.Parameters.AddWithValue("@Lida", notificacao.Lida);
            cmd.Parameters.AddWithValue("@DataLeitura", (object?)notificacao.DataLeitura ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataCadastro", notificacao.DataCadastro);

            var result = await cmd.ExecuteScalarAsync();
            notificacao.Id = Convert.ToInt32(result);
            return notificacao.Id;
        }

        public async Task<IEnumerable<NotificacaoSistema>> ObterPorColaboradorAsync(DBContext dbContext, int colaboradorId, int limite)
        {
            var itens = new List<NotificacaoSistema>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT TOP (@Limite)
                    Id, ColaboradorId, AtendimentoId, MinutosAntecedencia, Titulo, Mensagem,
                    DataNotificacao, Lida, DataLeitura, DataCadastro
                FROM NotificacaoSistema
                WHERE ColaboradorId = @ColaboradorId
                ORDER BY DataNotificacao DESC, Id DESC;";

            cmd.Parameters.AddWithValue("@Limite", Math.Clamp(limite, 1, 200));
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                itens.Add(new NotificacaoSistema
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                    AtendimentoId = Convert.ToInt32(dr["AtendimentoId"]),
                    MinutosAntecedencia = Convert.ToInt32(dr["MinutosAntecedencia"]),
                    Titulo = dr["Titulo"]?.ToString() ?? string.Empty,
                    Mensagem = dr["Mensagem"]?.ToString() ?? string.Empty,
                    DataNotificacao = Convert.ToDateTime(dr["DataNotificacao"]),
                    Lida = Convert.ToBoolean(dr["Lida"]),
                    DataLeitura = dr["DataLeitura"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataLeitura"]),
                    DataCadastro = Convert.ToDateTime(dr["DataCadastro"])
                });
            }

            return itens;
        }

        public async Task<int> ObterQuantidadeNaoLidasAsync(DBContext dbContext, int colaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM NotificacaoSistema
                WHERE ColaboradorId = @ColaboradorId
                  AND Lida = 0;";
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        public async Task<bool> MarcarComoLidaAsync(DBContext dbContext, int notificacaoId, int colaboradorId, DateTime dataLeitura)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE NotificacaoSistema
                SET Lida = 1,
                    DataLeitura = @DataLeitura
                WHERE Id = @Id
                  AND ColaboradorId = @ColaboradorId
                  AND Lida = 0;";
            cmd.Parameters.AddWithValue("@Id", notificacaoId);
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@DataLeitura", dataLeitura);

            var linhasAtualizadas = await cmd.ExecuteNonQueryAsync();
            if (linhasAtualizadas > 0)
                return true;

            await using var verificaCmd = con.CreateCommand();
            verificaCmd.CommandText = @"
                SELECT COUNT(1)
                FROM NotificacaoSistema
                WHERE Id = @Id
                  AND ColaboradorId = @ColaboradorId;";
            verificaCmd.Parameters.AddWithValue("@Id", notificacaoId);
            verificaCmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            return Convert.ToInt32(await verificaCmd.ExecuteScalarAsync()) > 0;
        }

        public async Task<bool> ExisteEmailEnviadoAsync(
            DBContext dbContext,
            int colaboradorId,
            int atendimentoId,
            int minutosAntecedencia,
            DateTime dataNotificacaoPrevista)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM NotificacaoEmailLog
                WHERE ColaboradorId = @ColaboradorId
                  AND AtendimentoId = @AtendimentoId
                  AND MinutosAntecedencia = @MinutosAntecedencia
                  AND ABS(DATEDIFF(MINUTE, DataEnvio, @DataNotificacaoPrevista)) <= 2;";

            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
            cmd.Parameters.AddWithValue("@MinutosAntecedencia", minutosAntecedencia);
            cmd.Parameters.AddWithValue("@DataNotificacaoPrevista", dataNotificacaoPrevista);

            return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
        }

        public async Task RegistrarEmailEnviadoAsync(
            DBContext dbContext,
            int colaboradorId,
            int atendimentoId,
            int minutosAntecedencia,
            string emailDestino,
            DateTime dataEnvio)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO NotificacaoEmailLog
                (ColaboradorId, AtendimentoId, MinutosAntecedencia, EmailDestino, DataEnvio)
                VALUES
                (@ColaboradorId, @AtendimentoId, @MinutosAntecedencia, @EmailDestino, @DataEnvio);";

            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
            cmd.Parameters.AddWithValue("@MinutosAntecedencia", minutosAntecedencia);
            cmd.Parameters.AddWithValue("@EmailDestino", emailDestino);
            cmd.Parameters.AddWithValue("@DataEnvio", dataEnvio);

            await cmd.ExecuteNonQueryAsync();
        }
    }
}
