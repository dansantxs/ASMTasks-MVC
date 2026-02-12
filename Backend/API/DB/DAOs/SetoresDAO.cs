using API.Models;

namespace API.DB.DAOs
{
    public class SetoresDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Setor setor)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Setor (Nome, Descricao, Ativo)
                VALUES (@Nome, @Descricao, @Ativo);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@Nome", setor.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)setor.Descricao ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Ativo", setor.Ativo);
            var result = await cmd.ExecuteScalarAsync();
            setor.Id = Convert.ToInt32(result);

            return setor.Id;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Setor setor)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"UPDATE Setor 
                                SET Nome = @Nome, Descricao = @Descricao 
                                WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", setor.Id);
            cmd.Parameters.AddWithValue("@Nome", setor.Nome);
            cmd.Parameters.AddWithValue("@Descricao", (object)setor.Descricao ?? DBNull.Value);
            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Setor SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Setor SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<Setor>> ObterTodosAsync(DBContext dbContext)
        {
            var setores = new List<Setor>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Ativo FROM Setor";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                var setor = new Setor
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
                setores.Add(setor);
            }

            return setores;
        }

        public async Task<Setor?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            Setor? setor = null;

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome, Descricao, Ativo FROM Setor WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                setor = new Setor
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    Descricao = dr["Descricao"]?.ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
            }

            return setor;
        }

        public async Task<bool> VerificarExistenciaPorNomeAsync(DBContext dbContext, string nome, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Setor 
                                WHERE Nome = @Nome AND (@Id IS NULL OR Id <> @Id)";
            cmd.Parameters.AddWithValue("@Nome", nome);
            cmd.Parameters.AddWithValue("@Id", (object)id ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        public async Task<bool> VerificarColaboradoresAtivosAsync(DBContext dbContext, int setorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Colaborador WHERE SetorId = @SetorId AND Ativo = 1";
            cmd.Parameters.AddWithValue("@SetorId", setorId);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        // Implementar o método de verificação de tarefas em andamento
    }
}
