using API.Models;

namespace API.DB.DAOs
{
    public class ClientesDAO
    {
        public async Task<int> CriarAsync(DBContext dbContext, Cliente cliente)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                INSERT INTO Cliente
                (Nome, Documento, TipoPessoa, RG, InscricaoEstadual, Email, Telefone, CEP, Cidade, UF, Logradouro, Bairro, Numero, Site, DataReferencia, Ativo)
                VALUES
                (@Nome, @Documento, @TipoPessoa, @RG, @InscricaoEstadual, @Email, @Telefone, @CEP, @Cidade, @UF, @Logradouro, @Bairro, @Numero, @Site, @DataReferencia, @Ativo);
                SELECT CAST(SCOPE_IDENTITY() AS int);
            ";

            cmd.Parameters.AddWithValue("@Nome", cliente.Nome);
            cmd.Parameters.AddWithValue("@Documento", cliente.Documento);
            cmd.Parameters.AddWithValue("@TipoPessoa", cliente.TipoPessoa);
            cmd.Parameters.AddWithValue("@RG", (object?)cliente.RG ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@InscricaoEstadual", (object?)cliente.InscricaoEstadual ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Email", (object?)cliente.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Telefone", (object?)cliente.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CEP", (object?)cliente.CEP ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cidade", (object?)cliente.Cidade ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UF", (object?)cliente.UF ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Logradouro", (object?)cliente.Logradouro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Bairro", (object?)cliente.Bairro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Numero", (object?)cliente.Numero ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Site", (object?)cliente.Site ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataReferencia", (object?)cliente.DataReferencia ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Ativo", cliente.Ativo);

            var result = await cmd.ExecuteScalarAsync();
            cliente.Id = Convert.ToInt32(result);
            return cliente.Id;
        }

        public async Task<bool> AtualizarAsync(DBContext dbContext, Cliente cliente)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                UPDATE Cliente SET
                    Nome = @Nome,
                    Documento = @Documento,
                    TipoPessoa = @TipoPessoa,
                    RG = @RG,
                    InscricaoEstadual = @InscricaoEstadual,
                    Email = @Email,
                    Telefone = @Telefone,
                    CEP = @CEP,
                    Cidade = @Cidade,
                    UF = @UF,
                    Logradouro = @Logradouro,
                    Bairro = @Bairro,
                    Numero = @Numero,
                    Site = @Site,
                    DataReferencia = @DataReferencia
                WHERE Id = @Id;
            ";

            cmd.Parameters.AddWithValue("@Id", cliente.Id);
            cmd.Parameters.AddWithValue("@Nome", cliente.Nome);
            cmd.Parameters.AddWithValue("@Documento", cliente.Documento);
            cmd.Parameters.AddWithValue("@TipoPessoa", cliente.TipoPessoa);
            cmd.Parameters.AddWithValue("@RG", (object?)cliente.RG ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@InscricaoEstadual", (object?)cliente.InscricaoEstadual ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Email", (object?)cliente.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Telefone", (object?)cliente.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CEP", (object?)cliente.CEP ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cidade", (object?)cliente.Cidade ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@UF", (object?)cliente.UF ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Logradouro", (object?)cliente.Logradouro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Bairro", (object?)cliente.Bairro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Numero", (object?)cliente.Numero ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Site", (object?)cliente.Site ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@DataReferencia", (object?)cliente.DataReferencia ?? DBNull.Value);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Cliente SET Ativo = 0 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<bool> ReativarAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "UPDATE Cliente SET Ativo = 1 WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            int linhas = await cmd.ExecuteNonQueryAsync();
            return linhas > 0;
        }

        public async Task<IEnumerable<Cliente>> ObterTodosAsync(DBContext dbContext)
        {
            var lista = new List<Cliente>();
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM Cliente";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new Cliente
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString() ?? string.Empty,
                    Documento = dr["Documento"].ToString() ?? string.Empty,
                    TipoPessoa = Convert.ToChar(dr["TipoPessoa"]),
                    RG = dr["RG"]?.ToString(),
                    InscricaoEstadual = dr["InscricaoEstadual"]?.ToString(),
                    Email = dr["Email"]?.ToString(),
                    Telefone = dr["Telefone"]?.ToString(),
                    CEP = dr["CEP"]?.ToString(),
                    Cidade = dr["Cidade"]?.ToString(),
                    UF = dr["UF"]?.ToString(),
                    Logradouro = dr["Logradouro"]?.ToString(),
                    Bairro = dr["Bairro"]?.ToString(),
                    Numero = dr["Numero"] as int?,
                    Site = dr["Site"]?.ToString(),
                    DataReferencia = dr["DataReferencia"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataReferencia"]),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                });
            }

            return lista;
        }

        public async Task<Cliente?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT * FROM Cliente WHERE Id = @Id";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                return new Cliente
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString() ?? string.Empty,
                    Documento = dr["Documento"].ToString() ?? string.Empty,
                    TipoPessoa = Convert.ToChar(dr["TipoPessoa"]),
                    RG = dr["RG"]?.ToString(),
                    InscricaoEstadual = dr["InscricaoEstadual"]?.ToString(),
                    Email = dr["Email"]?.ToString(),
                    Telefone = dr["Telefone"]?.ToString(),
                    CEP = dr["CEP"]?.ToString(),
                    Cidade = dr["Cidade"]?.ToString(),
                    UF = dr["UF"]?.ToString(),
                    Logradouro = dr["Logradouro"]?.ToString(),
                    Bairro = dr["Bairro"]?.ToString(),
                    Numero = dr["Numero"] as int?,
                    Site = dr["Site"]?.ToString(),
                    DataReferencia = dr["DataReferencia"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataReferencia"]),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                };
            }

            return null;
        }

        public async Task<bool> VerificarExistenciaPorDocumentoAsync(DBContext dbContext, string documento, int? id = null)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Cliente WHERE Documento = @Documento AND (@Id IS NULL OR Id <> @Id)";
            cmd.Parameters.AddWithValue("@Documento", documento);
            cmd.Parameters.AddWithValue("@Id", (object?)id ?? DBNull.Value);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }
    }
}
