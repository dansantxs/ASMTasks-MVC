using API.Models;

namespace API.DB.DAOs
{
    public class EtapasDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Etapa etapa)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Etapa (Nome, Descricao, Ativo, Ordem)
                VALUES (@Nome, @Descricao, @Ativo, @Ordem);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@Nome", etapa.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)etapa.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Ativo", etapa.Ativo);
            cmd.Parameters.AddWithValue("@Ordem", etapa.Ordem);

            var result = await cmd.ExecuteScalarAsync();
            etapa.Id = Convert.ToInt32(result);

            return etapa.Id;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Etapa etapa)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"UPDATE Etapa
                                SET Nome = @Nome, Descricao = @Descricao, Ordem = @Ordem
                                WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", etapa.Id);
            cmd.Parameters.AddWithValue("@Nome", etapa.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)etapa.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Ordem", etapa.Ordem);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Etapa SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Etapa SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> VerificarExistenciaPorNomeAsync(DBContext dbContext, string nome, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Etapa 
                                WHERE Nome = @Nome AND (@Id IS NULL OR Id <> @Id)";
            cmd.Parameters.AddWithValue("@Nome", nome);
            cmd.Parameters.AddWithValue("@Id", (object)id ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        public async Task<IEnumerable<Etapa>> ObterTodosAsync(DBContext dbContext)
        {
            var etapaes = new List<Etapa>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Ativo, Ordem FROM Etapa ORDER BY Ordem, Id";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                var etapa = new Etapa
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    Ordem = Convert.ToInt32(dr["Ordem"])
                };
                etapaes.Add(etapa);
            }

            return etapaes;
        }

        public async Task<Etapa?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            Etapa? etapa = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Ativo, Ordem FROM Etapa WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                etapa = new Etapa
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    Ordem = Convert.ToInt32(dr["Ordem"])
                };
            }

            return etapa;
        }

        public async Task ReordenarAsync(DBContext dbContext, IEnumerable<(int Id, int Ordem)> itens)
        {
            await using var con = await dbContext.GetConnectionAsync();
            foreach (var (id, ordem) in itens)
            {
                await using var cmd = con.CreateCommand();
                cmd.CommandText = "UPDATE Etapa SET Ordem = @Ordem WHERE Id = @Id";
                cmd.Parameters.AddWithValue("@Id", id);
                cmd.Parameters.AddWithValue("@Ordem", ordem);
                await cmd.ExecuteNonQueryAsync();
            }
        }

        // Implementar o método de verificação de tarefas em andamento
    }
}