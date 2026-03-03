using API.Models;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class NiveisAcessoDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, NivelAcesso nivelAcesso)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var tx = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                int id;
                await using (var cmd = con.CreateCommand())
                {
                    cmd.Transaction = tx;
                    cmd.CommandText = @"
                        INSERT INTO NivelAcesso (Nome, Descricao, Ativo, EhAdministrador)
                        VALUES (@Nome, @Descricao, @Ativo, @EhAdministrador);
                        SELECT CAST(SCOPE_IDENTITY() AS int);";
                    cmd.Parameters.AddWithValue("@Nome", nivelAcesso.Nome);
                    cmd.Parameters.AddWithValue("@Descricao", (object?)nivelAcesso.Descricao ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@Ativo", nivelAcesso.Ativo);
                    cmd.Parameters.AddWithValue("@EhAdministrador", nivelAcesso.EhAdministrador);
                    id = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                }

                await SubstituirPermissoesAsync(con, tx, id, nivelAcesso.Permissoes);
                await tx.CommitAsync();
                return id;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, NivelAcesso nivelAcesso, string nomeAnterior)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var tx = (SqlTransaction)await con.BeginTransactionAsync();

            try
            {
                int linhas;
                await using (var cmd = con.CreateCommand())
                {
                    cmd.Transaction = tx;
                    cmd.CommandText = @"
                        UPDATE NivelAcesso
                        SET Nome = @Nome,
                            Descricao = @Descricao,
                            EhAdministrador = @EhAdministrador
                        WHERE Id = @Id";
                    cmd.Parameters.AddWithValue("@Id", nivelAcesso.Id);
                    cmd.Parameters.AddWithValue("@Nome", nivelAcesso.Nome);
                    cmd.Parameters.AddWithValue("@Descricao", (object?)nivelAcesso.Descricao ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@EhAdministrador", nivelAcesso.EhAdministrador);
                    linhas = await cmd.ExecuteNonQueryAsync();
                }

                if (linhas == 0)
                {
                    await tx.RollbackAsync();
                    return false;
                }

                await SubstituirPermissoesAsync(con, tx, nivelAcesso.Id, nivelAcesso.Permissoes);
                await tx.CommitAsync();
                return true;
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE NivelAcesso SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE NivelAcesso SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task<bool> ExisteNomeAsync(DBContext dbContext, string nome, int? idIgnorar = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM NivelAcesso
                WHERE UPPER(Nome) = @Nome
                  AND (@IdIgnorar IS NULL OR Id <> @IdIgnorar)";
            cmd.Parameters.AddWithValue("@Nome", nome.Trim().ToUpperInvariant());
            cmd.Parameters.AddWithValue("@IdIgnorar", (object?)idIgnorar ?? DBNull.Value);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
        }

        public async Task<IEnumerable<NivelAcesso>> ObterTodosAsync(DBContext dbContext)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT na.Id, na.Nome, na.Descricao, na.Ativo, na.EhAdministrador, nap.TelaChave
                FROM NivelAcesso na
                LEFT JOIN NivelAcessoPermissao nap ON nap.NivelAcessoId = na.Id
                ORDER BY na.Nome, nap.TelaChave";

            return await LerListaAsync(cmd);
        }

        public async Task<NivelAcesso?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT na.Id, na.Nome, na.Descricao, na.Ativo, na.EhAdministrador, nap.TelaChave
                FROM NivelAcesso na
                LEFT JOIN NivelAcessoPermissao nap ON nap.NivelAcessoId = na.Id
                WHERE na.Id = @Id
                ORDER BY nap.TelaChave";
            cmd.Parameters.AddWithValue("@Id", id);

            return (await LerListaAsync(cmd)).FirstOrDefault();
        }

        public async Task<NivelAcesso?> ObterPorNomeAsync(DBContext dbContext, string nome)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT na.Id, na.Nome, na.Descricao, na.Ativo, na.EhAdministrador, nap.TelaChave
                FROM NivelAcesso na
                LEFT JOIN NivelAcessoPermissao nap ON nap.NivelAcessoId = na.Id
                WHERE UPPER(na.Nome) = @Nome
                ORDER BY nap.TelaChave";
            cmd.Parameters.AddWithValue("@Nome", nome.Trim().ToUpperInvariant());

            return (await LerListaAsync(cmd)).FirstOrDefault();
        }

        private static async Task<IEnumerable<NivelAcesso>> LerListaAsync(SqlCommand cmd)
        {
            var itens = new Dictionary<int, NivelAcesso>();
            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                var id = Convert.ToInt32(dr["Id"]);
                if (!itens.TryGetValue(id, out var nivel))
                {
                    nivel = new NivelAcesso
                    {
                        Id = id,
                        Nome = dr["Nome"].ToString() ?? string.Empty,
                        Descricao = dr["Descricao"] == DBNull.Value ? null : dr["Descricao"].ToString(),
                        Ativo = Convert.ToBoolean(dr["Ativo"]),
                        EhAdministrador = Convert.ToBoolean(dr["EhAdministrador"]),
                        Permissoes = new List<string>()
                    };
                    itens.Add(id, nivel);
                }

                if (dr["TelaChave"] != DBNull.Value)
                    nivel.Permissoes.Add(dr["TelaChave"].ToString() ?? string.Empty);
            }

            return itens.Values;
        }

        private static async Task SubstituirPermissoesAsync(SqlConnection con, SqlTransaction tx, int nivelAcessoId, IEnumerable<string> permissoes)
        {
            await using (var deleteCmd = con.CreateCommand())
            {
                deleteCmd.Transaction = tx;
                deleteCmd.CommandText = "DELETE FROM NivelAcessoPermissao WHERE NivelAcessoId = @NivelAcessoId";
                deleteCmd.Parameters.AddWithValue("@NivelAcessoId", nivelAcessoId);
                await deleteCmd.ExecuteNonQueryAsync();
            }

            foreach (var permissao in permissoes)
            {
                await using var insertCmd = con.CreateCommand();
                insertCmd.Transaction = tx;
                insertCmd.CommandText = @"
                    INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave)
                    VALUES (@NivelAcessoId, @TelaChave)";
                insertCmd.Parameters.AddWithValue("@NivelAcessoId", nivelAcessoId);
                insertCmd.Parameters.AddWithValue("@TelaChave", permissao);
                await insertCmd.ExecuteNonQueryAsync();
            }
        }
    }
}
