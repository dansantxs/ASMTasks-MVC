using API.Models;

namespace API.DB.DAOs
{
    public class CargosDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Cargo cargo)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Cargo (Nome, Descricao, Ativo)
                VALUES (@Nome, @Descricao, @Ativo);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@Nome", cargo.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)cargo.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Ativo", cargo.Ativo);

            var result = await cmd.ExecuteScalarAsync();
            cargo.Id = Convert.ToInt32(result);

            return cargo.Id;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Cargo cargo)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE Cargo
                SET Nome = @Nome, Descricao = @Descricao
                WHERE Id = @Id;
            ";

            cmd.Parameters.AddWithValue("@Id", cargo.Id);
            cmd.Parameters.AddWithValue("@Nome", cargo.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)cargo.Descricao ?? DBNull.Value);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<Cargo>> ObterTodosAsync(DBContext dbContext)
        {
            var cargos = new List<Cargo>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Ativo FROM Cargo";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                cargos.Add(new Cargo
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString()!,
                    Descricao = dr["Descricao"]?.ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                });
            }

            return cargos;
        }

        public async Task<Cargo?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Ativo FROM Cargo WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                return new Cargo
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString()!,
                    Descricao = dr["Descricao"]?.ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
            }

            return null;
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Cargo SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhasAfetadas = await cmd.ExecuteNonQueryAsync();
            return linhasAfetadas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Cargo SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhasAfetadas = await cmd.ExecuteNonQueryAsync();
            return linhasAfetadas > 0;
        }

        public async Task<bool> VerificarExistenciaPorNomeAsync(DBContext dbContext, string nome, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT COUNT(1)
                FROM Cargo
                WHERE Nome = @Nome
                  AND (@Id IS NULL OR Id <> @Id);
            ";

            cmd.Parameters.AddWithValue("@Nome", nome);
            cmd.Parameters.AddWithValue("@Id", (object)id ?? DBNull.Value);

            var resultado = await cmd.ExecuteScalarAsync();
            int total = Convert.ToInt32(resultado);

            return total > 0;
        }

        public async Task<bool> VerificarColaboradoresAtivosAsync(DBContext dbContext, int cargoId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Colaborador WHERE CargoId = @CargoId AND Ativo = 1";
            cmd.Parameters.AddWithValue("@CargoId", cargoId);

            var result = await cmd.ExecuteScalarAsync(); ;
            int count = Convert.ToInt32(result);

            return count > 0;
        }
    }
}