using API.Models;

namespace API.DB.DAOs
{
    public class PrioridadesDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Prioridade prioridade)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Prioridade (Nome, Descricao, Cor, Ativo)
                VALUES (@Nome, @Descricao, @Cor, @Ativo);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";
            cmd.Parameters.AddWithValue("@Nome", prioridade.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)prioridade.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cor", prioridade.Cor);
            cmd.Parameters.AddWithValue("@Ativo", prioridade.Ativo);

            var result = await cmd.ExecuteScalarAsync();
            prioridade.Id = Convert.ToInt32(result);

            return prioridade.Id;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Prioridade prioridade)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"UPDATE Prioridade 
                                SET Nome = @Nome, Descricao = @Descricao, Cor = @Cor 
                                WHERE Id = @Id AND Ativo = 1";
            cmd.Parameters.AddWithValue("@Id", prioridade.Id);
            cmd.Parameters.AddWithValue("@Nome", prioridade.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)prioridade.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cor", prioridade.Cor);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Prioridade SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Prioridade SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> VerificarExistenciaPorNomeAsync(DBContext dbContext, string nome, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Prioridade 
                                WHERE Nome = @Nome AND (@Id IS NULL OR Id <> @Id)";
            cmd.Parameters.AddWithValue("@Nome", nome);
            cmd.Parameters.AddWithValue("@Id", (object)id ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        public async Task<IEnumerable<Prioridade>> ObterTodosAsync(DBContext dbContext)
        {
            var prioridades = new List<Prioridade>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Cor, Ativo FROM Prioridade";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                var prioridade = new Prioridade
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    Cor = dr["Cor"].ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
                prioridades.Add(prioridade);
            }

            return prioridades;
        }

        public async Task<Prioridade?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            Prioridade? prioridade = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Cor, Ativo FROM Prioridade WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                prioridade = new Prioridade
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    Cor = dr["Cor"].ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
            }

            return prioridade;
        }

        // Implementar o método de verificação de tarefas em andamento
    }
}