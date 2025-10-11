using Microsoft.Data.SqlClient;

namespace API.DAOs
{
    public class DbContext
    {
        private readonly string _strCon;

        public DbContext()
        {
            try
            {
                _strCon = Environment.GetEnvironmentVariable("STRING_CONEXAO")
                          ?? throw new Exception("Não encontrei a variável de ambiente STRING_CONEXAO");
            }
            catch (Exception ex)
            {
                throw new Exception("Erro ao carregar string de conexão", ex);
            }
        }

        public async Task<SqlConnection> GetConnectionAsync()
        {
            var con = new SqlConnection(_strCon);
            await con.OpenAsync();
            return con;
        }
    }
}