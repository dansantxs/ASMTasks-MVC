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
                (Nome, Documento, TipoPessoa, RG, InscricaoEstadual, Email, Telefone, CEP, Cidade, UF, Logradouro, Bairro, Numero, Site, DataReferencia, Ativo, NomeFantasia, MatrizId)
                VALUES
                (@Nome, @Documento, @TipoPessoa, @RG, @InscricaoEstadual, @Email, @Telefone, @CEP, @Cidade, @UF, @Logradouro, @Bairro, @Numero, @Site, @DataReferencia, @Ativo, @NomeFantasia, @MatrizId);
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
            cmd.Parameters.AddWithValue("@NomeFantasia", (object?)cliente.NomeFantasia ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@MatrizId", (object?)cliente.MatrizId ?? DBNull.Value);

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
                    DataReferencia = @DataReferencia,
                    NomeFantasia = @NomeFantasia,
                    MatrizId = @MatrizId
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
            cmd.Parameters.AddWithValue("@NomeFantasia", (object?)cliente.NomeFantasia ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@MatrizId", (object?)cliente.MatrizId ?? DBNull.Value);

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
            cmd.CommandText = @"
                SELECT c.*, m.Nome AS NomeMatriz
                FROM Cliente c
                LEFT JOIN Cliente m ON m.Id = c.MatrizId
                ORDER BY c.Nome;
            ";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
                lista.Add(MapearCliente(dr));

            return lista;
        }

        public async Task<Cliente?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT c.*, m.Nome AS NomeMatriz
                FROM Cliente c
                LEFT JOIN Cliente m ON m.Id = c.MatrizId
                WHERE c.Id = @Id;
            ";
            cmd.Parameters.AddWithValue("@Id", id);

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
                return MapearCliente(dr);

            return null;
        }

        public async Task<IEnumerable<Cliente>> ObterMatrizesAsync(DBContext dbContext)
        {
            var lista = new List<Cliente>();
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT Id, Nome, NomeFantasia, Documento, TipoPessoa, Cidade, UF, Ativo
                FROM Cliente
                WHERE MatrizId IS NULL AND Ativo = 1
                ORDER BY Nome;
            ";

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new Cliente
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    Nome = dr["Nome"].ToString() ?? string.Empty,
                    NomeFantasia = dr["NomeFantasia"] == DBNull.Value ? null : dr["NomeFantasia"].ToString(),
                    Documento = dr["Documento"].ToString() ?? string.Empty,
                    TipoPessoa = Convert.ToChar(dr["TipoPessoa"]),
                    Cidade = dr["Cidade"] == DBNull.Value ? null : dr["Cidade"].ToString(),
                    UF = dr["UF"] == DBNull.Value ? null : dr["UF"].ToString(),
                    Ativo = Convert.ToBoolean(dr["Ativo"])
                });
            }

            return lista;
        }

        private static Cliente MapearCliente(System.Data.Common.DbDataReader dr)
        {
            return new Cliente
            {
                Id = Convert.ToInt32(dr["Id"]),
                Nome = dr["Nome"].ToString() ?? string.Empty,
                Documento = dr["Documento"].ToString() ?? string.Empty,
                TipoPessoa = Convert.ToChar(dr["TipoPessoa"]),
                RG = dr["RG"] == DBNull.Value ? null : dr["RG"].ToString(),
                InscricaoEstadual = dr["InscricaoEstadual"] == DBNull.Value ? null : dr["InscricaoEstadual"].ToString(),
                Email = dr["Email"] == DBNull.Value ? null : dr["Email"].ToString(),
                Telefone = dr["Telefone"] == DBNull.Value ? null : dr["Telefone"].ToString(),
                CEP = dr["CEP"] == DBNull.Value ? null : dr["CEP"].ToString(),
                Cidade = dr["Cidade"] == DBNull.Value ? null : dr["Cidade"].ToString(),
                UF = dr["UF"] == DBNull.Value ? null : dr["UF"].ToString(),
                Logradouro = dr["Logradouro"] == DBNull.Value ? null : dr["Logradouro"].ToString(),
                Bairro = dr["Bairro"] == DBNull.Value ? null : dr["Bairro"].ToString(),
                Numero = dr["Numero"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["Numero"]),
                Site = dr["Site"] == DBNull.Value ? null : dr["Site"].ToString(),
                DataReferencia = dr["DataReferencia"] == DBNull.Value ? null : Convert.ToDateTime(dr["DataReferencia"]),
                Ativo = Convert.ToBoolean(dr["Ativo"]),
                NomeFantasia = dr["NomeFantasia"] == DBNull.Value ? null : dr["NomeFantasia"].ToString(),
                MatrizId = dr["MatrizId"] == DBNull.Value ? null : (int?)Convert.ToInt32(dr["MatrizId"]),
                NomeMatriz = dr["NomeMatriz"] == DBNull.Value ? null : dr["NomeMatriz"].ToString()
            };
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

        public async Task<bool> VerificarAtendimentosAtivosAsync(DBContext dbContext, int clienteId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Atendimento WHERE ClienteId = @ClienteId AND Status <> 'C'";
            cmd.Parameters.AddWithValue("@ClienteId", clienteId);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        public async Task<bool> VerificarProjetosAtivosAsync(DBContext dbContext, int clienteId)
        {
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"SELECT COUNT(1) FROM Projeto WHERE ClienteId = @ClienteId AND Ativo = 1";
            cmd.Parameters.AddWithValue("@ClienteId", clienteId);

            var result = await cmd.ExecuteScalarAsync();
            return Convert.ToInt32(result) > 0;
        }

        public async Task<HashSet<int>> ObterClienteIdsComRegistrosAtivosAsync(DBContext dbContext)
        {
            var ids = new HashSet<int>();
            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT DISTINCT ClienteId FROM Projeto WHERE Ativo = 1
                UNION
                SELECT DISTINCT ClienteId FROM Atendimento WHERE Status <> 'C'
            ";
            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
                ids.Add(Convert.ToInt32(dr[0]));
            return ids;
        }
    }
}
