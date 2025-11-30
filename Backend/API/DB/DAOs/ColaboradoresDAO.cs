using API.Models;

namespace API.DB.DAOs
{
    public class ColaboradoresDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Colaborador colaborador)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Colaborador
                (Nome, CPF, Email, Telefone, CEP, Cidade, UF, Logradouro, Bairro, Numero, DataNascimento, DataAdmissao, Ativo, SetorId, CargoId)
                VALUES
                (@Nome, @CPF, @Email, @Telefone, @CEP, @Cidade, @UF, @Logradouro, @Bairro, @Numero, @DataNascimento, @DataAdmissao, @Ativo, @SetorId, @CargoId);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@Nome", colaborador.Nome);
            cmd.Parameters.AddWithValue("@CPF", colaborador.CPF);
            cmd.Parameters.AddWithValue("@Email", colaborador.Email);
            cmd.Parameters.AddWithValue("@Telefone", (object?)colaborador.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CEP", (object?)colaborador.CEP ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cidade", (object?)colaborador.Cidade ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UF", (object?)colaborador.UF ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Logradouro", (object?)colaborador.Logradouro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Bairro", (object?)colaborador.Bairro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Numero", (object?)colaborador.Numero ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataNascimento", colaborador.DataNascimento);
            cmd.Parameters.AddWithValue("@DataAdmissao", colaborador.DataAdmissao);
            cmd.Parameters.AddWithValue("@Ativo", colaborador.Ativo);
            cmd.Parameters.AddWithValue("@SetorId", colaborador.SetorId);
            cmd.Parameters.AddWithValue("@CargoId", colaborador.CargoId);

            var result = await cmd.ExecuteScalarAsync();
            colaborador.Id = Convert.ToInt32(result);
            return colaborador.Id;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Colaborador colaborador)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE Colaborador SET
                Nome=@Nome, CPF=@CPF, Email=@Email, Telefone=@Telefone, CEP=@CEP, Cidade=@Cidade, UF=@UF,
                Logradouro=@Logradouro, Bairro=@Bairro, Numero=@Numero, DataNascimento=@DataNascimento,
                SetorId=@SetorId, CargoId=@CargoId
                WHERE Id=@Id;
            ";

            cmd.Parameters.AddWithValue("@Id", colaborador.Id);
            cmd.Parameters.AddWithValue("@Nome", colaborador.Nome);
            cmd.Parameters.AddWithValue("@CPF", colaborador.CPF);
            cmd.Parameters.AddWithValue("@Email", colaborador.Email);
            cmd.Parameters.AddWithValue("@Telefone", (object?)colaborador.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CEP", (object?)colaborador.CEP ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cidade", (object?)colaborador.Cidade ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UF", (object?)colaborador.UF ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Logradouro", (object?)colaborador.Logradouro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Bairro", (object?)colaborador.Bairro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Numero", (object?)colaborador.Numero ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataNascimento", colaborador.DataNascimento);
            cmd.Parameters.AddWithValue("@SetorId", colaborador.SetorId);
            cmd.Parameters.AddWithValue("@CargoId", colaborador.CargoId);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Colaborador SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Colaborador SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<Colaborador>> ObterTodosAsync(DBContext dbContext)
        {
            var lista = new List<Colaborador>();
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM Colaborador";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new Colaborador
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    CPF = dr["CPF"].ToString(),
                    Email = dr["Email"].ToString(),
                    Telefone = dr["Telefone"]?.ToString(),
                    CEP = dr["CEP"]?.ToString(),
                    Cidade = dr["Cidade"]?.ToString(),
                    UF = dr["UF"]?.ToString(),
                    Logradouro = dr["Logradouro"]?.ToString(),
                    Bairro = dr["Bairro"]?.ToString(),
                    Numero = dr["Numero"] as int?,
                    DataNascimento = Convert.ToDateTime(dr["DataNascimento"]),
                    DataAdmissao = Convert.ToDateTime(dr["DataAdmissao"]),
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    SetorId = Convert.ToInt32(dr["SetorId"]),
                    CargoId = Convert.ToInt32(dr["CargoId"])
                });
            }

            return lista;
        }

        public async Task<Colaborador?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM Colaborador WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                return new Colaborador
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString(),
                    CPF = dr["CPF"].ToString(),
                    Email = dr["Email"].ToString(),
                    Telefone = dr["Telefone"]?.ToString(),
                    CEP = dr["CEP"]?.ToString(),
                    Cidade = dr["Cidade"]?.ToString(),
                    UF = dr["UF"]?.ToString(),
                    Logradouro = dr["Logradouro"]?.ToString(),
                    Bairro = dr["Bairro"]?.ToString(),
                    Numero = dr["Numero"] as int?,
                    DataNascimento = Convert.ToDateTime(dr["DataNascimento"]),
                    DataAdmissao = Convert.ToDateTime(dr["DataAdmissao"]),
                    Ativo = Convert.ToBoolean(dr["Ativo"]),
                    SetorId = Convert.ToInt32(dr["SetorId"]),
                    CargoId = Convert.ToInt32(dr["CargoId"])
                };
            }

            return null;
        }

        public async Task<bool> VerificarExistenciaPorCPFAsync(DBContext dbContext, string cpf, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Colaborador WHERE CPF = @CPF AND (@Id IS NULL OR Id <> @Id)";
            cmd.Parameters.AddWithValue("@CPF", cpf);
            cmd.Parameters.AddWithValue("@Id", (object?)id ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        public async Task<bool> VerificarResponsavelSetorAsync(DBContext dbContext, int colaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Setor WHERE ResponsavelId = @ColaboradorId AND Ativo = 1";
            cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);

            var result = await cmd.ExecuteScalarAsync(); ;
            int count = Convert.ToInt32(result);

            return count > 0;
        }

        // Implementar o método de verificação de tarefas em andamento
    }
}