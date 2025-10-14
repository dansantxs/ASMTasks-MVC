using API.Models;

namespace API.DAOs
{
    public class EtapasDAO
    {
        public async Task<int> CriarAsync(DbContext dbContext, Etapa etapa)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO EtapaDesenvolvimento (Nome, Descricao, CriadoEm, Ativo)
                VALUES (@Nome, @Descricao, @CriadoEm, @Ativo);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@Nome", etapa.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)etapa.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CriadoEm", etapa.CriadoEm);
            cmd.Parameters.AddWithValue("@Ativo", etapa.Ativo);

            var result = await cmd.ExecuteScalarAsync();
            etapa.Id = Convert.ToInt32(result);

            return etapa.Id;
        }

        public async Task<bool> AtualizarAsync(DbContext dbContext, Etapa etapa)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"UPDATE EtapaDesenvolvimento 
                                SET Nome = @Nome, Descricao = @Descricao
                                WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", etapa.Id);
            cmd.Parameters.AddWithValue("@Nome", etapa.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)etapa.Descricao ?? DBNull.Value);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(DbContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE EtapaDesenvolvimento SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DbContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE EtapaDesenvolvimento SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> VerificarExistenciaPorNomeAsync(DbContext dbContext, string nome, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM EtapaDesenvolvimento 
                                WHERE Nome = @Nome AND (@Id IS NULL OR Id <> @Id)";
            cmd.Parameters.AddWithValue("@Nome", nome);
            cmd.Parameters.AddWithValue("@Id", (object)id ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        public async Task<IEnumerable<Etapa>> ObterTodosAsync(DbContext dbContext)
        {
            var etapaes = new List<Etapa>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, CriadoEm, Ativo FROM EtapaDesenvolvimento";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                var etapa = new Etapa
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    CriadoEm = Convert.ToDateTime(dr["CriadoEm"]),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
                etapaes.Add(etapa);
            }

            return etapaes;
        }

        public async Task<Etapa?> ObterPorIdAsync(DbContext dbContext, int id)
        {
            Etapa? etapa = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, CriadoEm, Ativo FROM EtapaDesenvolvimento WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                etapa = new Etapa
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    CriadoEm = Convert.ToDateTime(dr["CriadoEm"]),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
            }

            return etapa;
        }

        // Implementar o método de verificação de tarefas em andamento
    }
}