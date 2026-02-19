using API.Models;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class AtendimentoColaboradoresDAO
    {
        public async Task InserirColaboradoresAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId,
            IEnumerable<int> colaboradoresIds)
        {
            foreach (var colaboradorId in colaboradoresIds.Distinct())
            {
                await using var cmd = connection.CreateCommand();
                cmd.Transaction = transaction;
                cmd.CommandText = @"
                    INSERT INTO AtendimentoColaborador (AtendimentoId, ColaboradorId)
                    VALUES (@AtendimentoId, @ColaboradorId);
                ";
                cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
                await cmd.ExecuteNonQueryAsync();
            }
        }

        public async Task RemoverPorAtendimentoIdAsync(
            SqlConnection connection,
            SqlTransaction transaction,
            int atendimentoId)
        {
            await using var cmd = connection.CreateCommand();
            cmd.Transaction = transaction;
            cmd.CommandText = "DELETE FROM AtendimentoColaborador WHERE AtendimentoId = @AtendimentoId";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<IEnumerable<int>> ObterColaboradoresIdsAsync(DBContext dbContext, int atendimentoId)
        {
            var ids = new List<int>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT ColaboradorId
                FROM AtendimentoColaborador
                WHERE AtendimentoId = @AtendimentoId
                ORDER BY ColaboradorId;
            ";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
                ids.Add(Convert.ToInt32(dr["ColaboradorId"]));

            return ids;
        }

        public async Task<IEnumerable<AtendimentoColaborador>> ObterPorAtendimentoIdAsync(DBContext dbContext, int atendimentoId)
        {
            var lista = new List<AtendimentoColaborador>();

            await using var con = await dbContext.GetConnectionAsync();
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT AtendimentoId, ColaboradorId
                FROM AtendimentoColaborador
                WHERE AtendimentoId = @AtendimentoId
                ORDER BY ColaboradorId;
            ";
            cmd.Parameters.AddWithValue("@AtendimentoId", atendimentoId);

            await using var dr = await cmd.ExecuteReaderAsync();
            while (await dr.ReadAsync())
            {
                lista.Add(new AtendimentoColaborador
                {
                    AtendimentoId = Convert.ToInt32(dr["AtendimentoId"]),
                    ColaboradorId = Convert.ToInt32(dr["ColaboradorId"])
                });
            }

            return lista;
        }
    }
}
