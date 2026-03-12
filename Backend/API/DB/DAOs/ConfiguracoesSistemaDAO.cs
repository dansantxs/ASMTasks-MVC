using API.Models;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class ConfiguracoesSistemaDAO
    {
        public async Task<ConfiguracaoSistema> ObterAsync(DBContext dbContext)
        {
            await using var con = await dbContext.GetConnectionAsync();

            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT TOP 1 Id, HoraInicioAgenda, HoraFimAgenda, LogoBase64,
                       Email, Telefone, RazaoSocial, NomeFantasia, Cnpj, InscricaoEstadual,
                       Cep, Logradouro, Numero, Bairro, Cidade, Uf,
                       SmtpServidor, SmtpPorta, SmtpUsuario, SmtpSenha, SmtpUsarSslTls
                FROM ConfiguracaoSistema
                WHERE Id = 1;";

            await using var dr = await cmd.ExecuteReaderAsync();
            if (await dr.ReadAsync())
            {
                return new ConfiguracaoSistema
                {
                    Id = Convert.ToInt32(dr["Id"]),
                    HoraInicioAgenda = (TimeSpan)dr["HoraInicioAgenda"],
                    HoraFimAgenda = (TimeSpan)dr["HoraFimAgenda"],
                    LogoBase64 = dr["LogoBase64"] == DBNull.Value ? null : dr["LogoBase64"].ToString(),
                    Email = dr["Email"] == DBNull.Value ? null : dr["Email"].ToString(),
                    Telefone = dr["Telefone"] == DBNull.Value ? null : dr["Telefone"].ToString(),
                    RazaoSocial = dr["RazaoSocial"] == DBNull.Value ? null : dr["RazaoSocial"].ToString(),
                    NomeFantasia = dr["NomeFantasia"] == DBNull.Value ? null : dr["NomeFantasia"].ToString(),
                    Cnpj = dr["Cnpj"] == DBNull.Value ? null : dr["Cnpj"].ToString(),
                    InscricaoEstadual = dr["InscricaoEstadual"] == DBNull.Value ? null : dr["InscricaoEstadual"].ToString(),
                    Cep = dr["Cep"] == DBNull.Value ? null : dr["Cep"].ToString(),
                    Logradouro = dr["Logradouro"] == DBNull.Value ? null : dr["Logradouro"].ToString(),
                    Numero = dr["Numero"] == DBNull.Value ? null : dr["Numero"].ToString(),
                    Bairro = dr["Bairro"] == DBNull.Value ? null : dr["Bairro"].ToString(),
                    Cidade = dr["Cidade"] == DBNull.Value ? null : dr["Cidade"].ToString(),
                    Uf = dr["Uf"] == DBNull.Value ? null : dr["Uf"].ToString(),
                    SmtpServidor = dr["SmtpServidor"] == DBNull.Value ? null : dr["SmtpServidor"].ToString(),
                    SmtpPorta = dr["SmtpPorta"] == DBNull.Value ? null : Convert.ToInt32(dr["SmtpPorta"]),
                    SmtpUsuario = dr["SmtpUsuario"] == DBNull.Value ? null : dr["SmtpUsuario"].ToString(),
                    SmtpSenha = dr["SmtpSenha"] == DBNull.Value ? null : dr["SmtpSenha"].ToString(),
                    SmtpUsarSslTls = dr["SmtpUsarSslTls"] != DBNull.Value && Convert.ToBoolean(dr["SmtpUsarSslTls"])
                };
            }

            return new ConfiguracaoSistema();
        }

        public async Task UpsertAsync(DBContext dbContext, ConfiguracaoSistema configuracao)
        {
            await using var con = await dbContext.GetConnectionAsync();

            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                MERGE ConfiguracaoSistema AS target
                USING (SELECT 1 AS Id) AS source
                ON target.Id = source.Id
                WHEN MATCHED THEN
                    UPDATE SET HoraInicioAgenda = @HoraInicioAgenda,
                               HoraFimAgenda = @HoraFimAgenda,
                               LogoBase64 = @LogoBase64,
                               Email = @Email,
                               Telefone = @Telefone,
                               RazaoSocial = @RazaoSocial,
                               NomeFantasia = @NomeFantasia,
                               Cnpj = @Cnpj,
                               InscricaoEstadual = @InscricaoEstadual,
                               Cep = @Cep,
                               Logradouro = @Logradouro,
                               Numero = @Numero,
                               Bairro = @Bairro,
                               Cidade = @Cidade,
                               Uf = @Uf,
                               SmtpServidor = @SmtpServidor,
                               SmtpPorta = @SmtpPorta,
                               SmtpUsuario = @SmtpUsuario,
                               SmtpSenha = @SmtpSenha,
                               SmtpUsarSslTls = @SmtpUsarSslTls
                WHEN NOT MATCHED THEN
                    INSERT (Id, HoraInicioAgenda, HoraFimAgenda, LogoBase64, Email, Telefone, RazaoSocial, NomeFantasia, Cnpj, InscricaoEstadual, Cep, Logradouro, Numero, Bairro, Cidade, Uf, SmtpServidor, SmtpPorta, SmtpUsuario, SmtpSenha, SmtpUsarSslTls)
                    VALUES (1, @HoraInicioAgenda, @HoraFimAgenda, @LogoBase64, @Email, @Telefone, @RazaoSocial, @NomeFantasia, @Cnpj, @InscricaoEstadual, @Cep, @Logradouro, @Numero, @Bairro, @Cidade, @Uf, @SmtpServidor, @SmtpPorta, @SmtpUsuario, @SmtpSenha, @SmtpUsarSslTls);";

            cmd.Parameters.AddWithValue("@HoraInicioAgenda", configuracao.HoraInicioAgenda);
            cmd.Parameters.AddWithValue("@HoraFimAgenda", configuracao.HoraFimAgenda);
            cmd.Parameters.AddWithValue("@LogoBase64", (object?)configuracao.LogoBase64 ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Email", (object?)configuracao.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Telefone", (object?)configuracao.Telefone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@RazaoSocial", (object?)configuracao.RazaoSocial ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@NomeFantasia", (object?)configuracao.NomeFantasia ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cnpj", (object?)configuracao.Cnpj ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@InscricaoEstadual", (object?)configuracao.InscricaoEstadual ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cep", (object?)configuracao.Cep ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Logradouro", (object?)configuracao.Logradouro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Numero", (object?)configuracao.Numero ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Bairro", (object?)configuracao.Bairro ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Cidade", (object?)configuracao.Cidade ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Uf", (object?)configuracao.Uf ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@SmtpServidor", (object?)configuracao.SmtpServidor ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@SmtpPorta", (object?)configuracao.SmtpPorta ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@SmtpUsuario", (object?)configuracao.SmtpUsuario ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@SmtpSenha", (object?)configuracao.SmtpSenha ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@SmtpUsarSslTls", configuracao.SmtpUsarSslTls);

            await cmd.ExecuteNonQueryAsync();
        }
    }
}
