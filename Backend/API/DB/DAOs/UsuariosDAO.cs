using API.Models;

namespace API.DB.DAOs
{
    public class UsuariosDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Usuario usuario)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Usuario (ColaboradorId, Login, SenhaHash, Ativo, NivelAcesso, DataCadastro)
                VALUES (@ColaboradorId, @Login, @SenhaHash, @Ativo, @NivelAcesso, @DataCadastro);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@ColaboradorId", usuario.ColaboradorId);
            cmd.Parameters.AddWithValue("@Login", usuario.Login);
            cmd.Parameters.AddWithValue("@SenhaHash", usuario.SenhaHash);
            cmd.Parameters.AddWithValue("@Ativo", usuario.Ativo);
            cmd.Parameters.AddWithValue("@NivelAcesso", usuario.NivelAcesso);
            cmd.Parameters.AddWithValue("@DataCadastro", usuario.DataCadastro);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result);
        }

        public async Task<bool> ExisteLoginAsync(DBContext dbContext, string login, int? usuarioIdIgnorar = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT COUNT(1) FROM Usuario WHERE Login = @Login AND (@UsuarioIdIgnorar IS NULL OR Id <> @UsuarioIdIgnorar)";
            cmd.Parameters.AddWithValue("@Login", login);
            cmd.Parameters.AddWithValue("@UsuarioIdIgnorar", (object?)usuarioIdIgnorar ?? DBNull.Value);
            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        public async Task<Usuario?> ObterParaLoginAsync(DBContext dbContext, string login)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT u.Id, u.ColaboradorId, u.Login, u.SenhaHash, u.Ativo, u.NivelAcesso, u.DataCadastro,
                       c.Nome AS NomeColaborador, c.Ativo AS ColaboradorAtivo
                FROM Usuario u
                INNER JOIN Colaborador c ON c.Id = u.ColaboradorId
                WHERE u.Login = @Login
                  AND u.Ativo = 1
                  AND c.Ativo = 1;
            ";
            cmd.Parameters.AddWithValue("@Login", login);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (!await dr.ReadAsync())
                return null;

            return new Usuario
            {
                Id = Convert.ToInt32(dr["Id"]),
                ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                Login = dr["Login"].ToString() ?? string.Empty,
                SenhaHash = dr["SenhaHash"].ToString() ?? string.Empty,
                Ativo = Convert.ToBoolean(dr["Ativo"]),
                NivelAcesso = Convert.ToInt32(dr["NivelAcesso"]),
                DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                NomeColaborador = dr["NomeColaborador"].ToString() ?? string.Empty,
                ColaboradorAtivo = Convert.ToBoolean(dr["ColaboradorAtivo"])
            };
        }

        public async Task<Usuario?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT u.Id, u.ColaboradorId, u.Login, u.SenhaHash, u.Ativo, u.NivelAcesso, u.DataCadastro,
                       c.Nome AS NomeColaborador, c.Ativo AS ColaboradorAtivo
                FROM Usuario u
                INNER JOIN Colaborador c ON c.Id = u.ColaboradorId
                WHERE u.Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (!await dr.ReadAsync())
                return null;

            return new Usuario
            {
                Id = Convert.ToInt32(dr["Id"]),
                ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                Login = dr["Login"].ToString() ?? string.Empty,
                SenhaHash = dr["SenhaHash"].ToString() ?? string.Empty,
                Ativo = Convert.ToBoolean(dr["Ativo"]),
                NivelAcesso = Convert.ToInt32(dr["NivelAcesso"]),
                DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                NomeColaborador = dr["NomeColaborador"].ToString() ?? string.Empty,
                ColaboradorAtivo = Convert.ToBoolean(dr["ColaboradorAtivo"])
            };
        }

        public async Task<Usuario?> ObterPorColaboradorIdAsync(DBContext dbContext, int colaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT u.Id, u.ColaboradorId, u.Login, u.SenhaHash, u.Ativo, u.NivelAcesso, u.DataCadastro,
                       c.Nome AS NomeColaborador, c.Ativo AS ColaboradorAtivo
                FROM Usuario u
                INNER JOIN Colaborador c ON c.Id = u.ColaboradorId
                WHERE u.ColaboradorId = @ColaboradorId;
            ";
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (!await dr.ReadAsync())
                return null;

            return new Usuario
            {
                Id = Convert.ToInt32(dr["Id"]),
                ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                Login = dr["Login"].ToString() ?? string.Empty,
                SenhaHash = dr["SenhaHash"].ToString() ?? string.Empty,
                Ativo = Convert.ToBoolean(dr["Ativo"]),
                NivelAcesso = Convert.ToInt32(dr["NivelAcesso"]),
                DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                NomeColaborador = dr["NomeColaborador"].ToString() ?? string.Empty,
                ColaboradorAtivo = Convert.ToBoolean(dr["ColaboradorAtivo"])
            };
        }

        public async Task<bool> AtualizarSenhaAsync(DBContext dbContext, int usuarioId, string novaSenhaHash)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Usuario SET SenhaHash = @SenhaHash WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", usuarioId);
            cmd.Parameters.AddWithValue("@SenhaHash", novaSenhaHash);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task<bool> AtualizarLoginAsync(DBContext dbContext, int usuarioId, string novoLogin)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Usuario SET Login = @Login WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", usuarioId);
            cmd.Parameters.AddWithValue("@Login", novoLogin);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task AtualizarStatusPorColaboradorIdAsync(DBContext dbContext, int colaboradorId, bool ativo)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Usuario SET Ativo = @Ativo WHERE ColaboradorId = @ColaboradorId";
            cmd.Parameters.AddWithValue("@Ativo", ativo);
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<IEnumerable<Usuario>> ObterTodosParaAdministracaoAsync(DBContext dbContext)
        {
            var lista = new List<Usuario>();
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT u.Id, u.ColaboradorId, u.Login, u.SenhaHash, u.Ativo, u.NivelAcesso, u.DataCadastro,
                       c.Nome AS NomeColaborador, c.Ativo AS ColaboradorAtivo
                FROM Usuario u
                INNER JOIN Colaborador c ON c.Id = u.ColaboradorId
                ORDER BY c.Nome";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new Usuario
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    ColaboradorId = Convert.ToInt32(dr["ColaboradorId"]),
                    Login = dr["Login"].ToString() ?? string.Empty,
                    SenhaHash = dr["SenhaHash"].ToString() ?? string.Empty,
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    NivelAcesso = Convert.ToInt32(dr["NivelAcesso"]),
                    DataCadastro = Convert.ToDateTime(dr["DataCadastro"]),
                    NomeColaborador = dr["NomeColaborador"].ToString() ?? string.Empty,
                    ColaboradorAtivo = Convert.ToBoolean(dr["ColaboradorAtivo"])
                });
            }

            return lista;
        }

        public async Task<bool> AtualizarNivelAcessoAsync(DBContext dbContext, int usuarioId, int nivelAcessoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Usuario SET NivelAcesso = @NivelAcesso WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", usuarioId);
            cmd.Parameters.AddWithValue("@NivelAcesso", nivelAcessoId);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task<bool> ExisteUsuarioComNivelAcessoAsync(DBContext dbContext, int nivelAcessoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT COUNT(1) FROM Usuario WHERE NivelAcesso = @NivelAcesso";
            cmd.Parameters.AddWithValue("@NivelAcesso", nivelAcessoId);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
        }

        public async Task<bool> InativarPorIdAsync(DBContext dbContext, int usuarioId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Usuario SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", usuarioId);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task<bool> ReativarPorIdAsync(DBContext dbContext, int usuarioId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Usuario SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", usuarioId);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        public async Task<bool> ExisteUsuarioAdministradorAsync(DBContext dbContext)
        {
            return await ContarUsuariosAdministradoresAtivosAsync(dbContext) > 0;
        }

        public async Task<int> ContarUsuariosAdministradoresAtivosAsync(DBContext dbContext)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM Usuario u
                INNER JOIN NivelAcesso na ON na.Id = u.NivelAcesso
                WHERE u.Ativo = 1
                  AND na.Ativo = 1
                  AND na.EhAdministrador = 1";
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        public async Task<int> ContarUsuariosAdministradoresAtivosPorNivelAsync(DBContext dbContext, int nivelAcessoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM Usuario u
                INNER JOIN NivelAcesso na ON na.Id = u.NivelAcesso
                WHERE u.Ativo = 1
                  AND na.Ativo = 1
                  AND na.EhAdministrador = 1
                  AND u.NivelAcesso = @NivelAcessoId";
            cmd.Parameters.AddWithValue("@NivelAcessoId", nivelAcessoId);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        public async Task<bool> UsuarioEhAdministradorAtivoAsync(DBContext dbContext, int usuarioId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM Usuario u
                INNER JOIN NivelAcesso na ON na.Id = u.NivelAcesso
                WHERE u.Id = @UsuarioId
                  AND u.Ativo = 1
                  AND na.Ativo = 1
                  AND na.EhAdministrador = 1";
            cmd.Parameters.AddWithValue("@UsuarioId", usuarioId);
            return Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
        }
    }
}
