using API.DTOs.Dashboard;
using Microsoft.Data.SqlClient;

namespace API.DB.DAOs
{
    public class DashboardDAO
    {
        public async Task<DashboardDTO> ObterDashboardAsync(
            DBContext dbContext,
            int colaboradorIdLogado,
            bool ehAdministrador,
            int? filtroColaboradorId)
        {
            await using var con = await dbContext.GetConnectionAsync();

            bool filtrarPorColaborador = !ehAdministrador || filtroColaboradorId.HasValue;
            int idParaFiltro = (ehAdministrador && filtroColaboradorId.HasValue)
                ? filtroColaboradorId.Value
                : colaboradorIdLogado;

            var resultado = new DashboardDTO { EhAdministrador = ehAdministrador };

            resultado.Atendimentos = await ObterAtendimentosAsync(con, idParaFiltro, filtrarPorColaborador);
            resultado.Tarefas = await ObterTarefasAsync(con, idParaFiltro, filtrarPorColaborador, ehAdministrador && !filtroColaboradorId.HasValue);

            if (ehAdministrador)
            {
                resultado.Projetos = await ObterProjetosAsync(con);
                resultado.Colaboradores = await ObterColaboradoresAsync(con);
                resultado.ProjetosSemMovimentacao = await ObterProjetosSemMovimentacaoAsync(con);
                resultado.ColaboradoresDisponiveis = await ObterColaboradoresDisponiveisAsync(con);

                if (filtroColaboradorId.HasValue)
                {
                    resultado.Filtro = new DashboardFiltroDTO
                    {
                        ColaboradorId = filtroColaboradorId.Value,
                        ColaboradorNome = resultado.ColaboradoresDisponiveis
                            .FirstOrDefault(c => c.Id == filtroColaboradorId.Value)?.Nome ?? ""
                    };
                }
            }

            return resultado;
        }

        private async Task<DashboardAtendimentosDTO> ObterAtendimentosAsync(
            SqlConnection con, int colaboradorId, bool filtrarPorColaborador)
        {
            var dto = new DashboardAtendimentosDTO();
            await using var cmd = con.CreateCommand();

            // Contagens gerais
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT
                        SUM(CASE WHEN CAST(a.DataHoraInicio AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END),
                        SUM(CASE WHEN a.Status = 'A' THEN 1 ELSE 0 END),
                        SUM(CASE WHEN a.Status = 'A' AND a.DataHoraFim IS NOT NULL AND a.DataHoraFim < GETDATE() THEN 1 ELSE 0 END),
                        SUM(CASE WHEN a.Status = 'R'
                                  AND MONTH(a.DataHoraConclusao) = MONTH(GETDATE())
                                  AND YEAR(a.DataHoraConclusao) = YEAR(GETDATE()) THEN 1 ELSE 0 END)
                    FROM Atendimento a
                    INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                    WHERE ac.ColaboradorId = @ColaboradorId
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT
                        SUM(CASE WHEN CAST(DataHoraInicio AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END),
                        SUM(CASE WHEN Status = 'A' THEN 1 ELSE 0 END),
                        SUM(CASE WHEN Status = 'A' AND DataHoraFim IS NOT NULL AND DataHoraFim < GETDATE() THEN 1 ELSE 0 END),
                        SUM(CASE WHEN Status = 'R'
                                  AND MONTH(DataHoraConclusao) = MONTH(GETDATE())
                                  AND YEAR(DataHoraConclusao) = YEAR(GETDATE()) THEN 1 ELSE 0 END)
                    FROM Atendimento
                ";
            }

            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                if (await reader.ReadAsync())
                {
                    dto.Hoje = reader.IsDBNull(0) ? 0 : reader.GetInt32(0);
                    dto.Agendados = reader.IsDBNull(1) ? 0 : reader.GetInt32(1);
                    dto.EmAtraso = reader.IsDBNull(2) ? 0 : reader.GetInt32(2);
                    dto.RealizadosMes = reader.IsDBNull(3) ? 0 : reader.GetInt32(3);
                }
            }

            // Tendência: realizados por mês nos últimos 6 meses
            cmd.Parameters.Clear();
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT YEAR(a.DataHoraConclusao), MONTH(a.DataHoraConclusao), COUNT(*)
                    FROM Atendimento a
                    INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                    WHERE ac.ColaboradorId = @ColaboradorId
                      AND a.Status = 'R'
                      AND a.DataHoraConclusao >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    GROUP BY YEAR(a.DataHoraConclusao), MONTH(a.DataHoraConclusao)
                    ORDER BY 1, 2
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT YEAR(DataHoraConclusao), MONTH(DataHoraConclusao), COUNT(*)
                    FROM Atendimento
                    WHERE Status = 'R'
                      AND DataHoraConclusao >= DATEADD(MONTH, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                    GROUP BY YEAR(DataHoraConclusao), MONTH(DataHoraConclusao)
                    ORDER BY 1, 2
                ";
            }

            var tendenciaBruta = new Dictionary<(int, int), int>();
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                    tendenciaBruta[(reader.GetInt32(0), reader.GetInt32(1))] = reader.GetInt32(2);
            }

            var cultura = new System.Globalization.CultureInfo("pt-BR");
            var hoje = DateTime.Now;
            for (int i = 5; i >= 0; i--)
            {
                var ref_ = hoje.AddMonths(-i);
                var chave = (ref_.Year, ref_.Month);
                dto.Tendencia.Add(new TendenciaMensalDTO
                {
                    Ano = ref_.Year,
                    Mes = ref_.Month,
                    Total = tendenciaBruta.TryGetValue(chave, out var v) ? v : 0,
                    Label = new DateTime(ref_.Year, ref_.Month, 1).ToString("MMM/yy", cultura)
                });
            }

            // Próximos 5 atendimentos agendados
            cmd.Parameters.Clear();
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT TOP 5 a.Id, a.Titulo, c.Nome, a.DataHoraInicio
                    FROM Atendimento a
                    INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                    INNER JOIN Cliente c ON c.Id = a.ClienteId
                    WHERE ac.ColaboradorId = @ColaboradorId
                      AND a.Status = 'A'
                      AND a.DataHoraInicio >= GETDATE()
                    ORDER BY a.DataHoraInicio ASC
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT TOP 5 a.Id, a.Titulo, c.Nome, a.DataHoraInicio
                    FROM Atendimento a
                    INNER JOIN Cliente c ON c.Id = a.ClienteId
                    WHERE a.Status = 'A'
                      AND a.DataHoraInicio >= GETDATE()
                    ORDER BY a.DataHoraInicio ASC
                ";
            }
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.Proximos.Add(new ProximoAtendimentoDTO
                    {
                        Id = reader.GetInt32(0),
                        Titulo = reader.GetString(1),
                        ClienteNome = reader.GetString(2),
                        DataHoraInicio = reader.GetDateTime(3)
                    });
                }
            }

            return dto;
        }

        private async Task<DashboardTarefasDTO> ObterTarefasAsync(
            SqlConnection con, int colaboradorId, bool filtrarPorColaborador, bool incluirSemResponsavel)
        {
            var dto = new DashboardTarefasDTO();
            await using var cmd = con.CreateCommand();

            // Total em projetos ativos
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    WHERE t.ColaboradorResponsavelId = @ColaboradorId
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                ";
            }
            dto.Total = Convert.ToInt32(await cmd.ExecuteScalarAsync() ?? 0);

            // Concluídas este mês: tarefas movidas para etapa final este mês
            cmd.Parameters.Clear();
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT COUNT(DISTINCT h.TarefaId)
                    FROM ProjetoTarefaHistorico h
                    INNER JOIN ProjetoTarefa t ON t.Id = h.TarefaId
                    INNER JOIN Etapa e ON e.Id = h.EtapaId AND e.EhEtapaFinal = 1
                    WHERE h.Tipo = 'E'
                      AND t.ColaboradorResponsavelId = @ColaboradorId
                      AND MONTH(h.DataHoraAcao) = MONTH(GETDATE())
                      AND YEAR(h.DataHoraAcao) = YEAR(GETDATE())
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT COUNT(DISTINCT h.TarefaId)
                    FROM ProjetoTarefaHistorico h
                    INNER JOIN Etapa e ON e.Id = h.EtapaId AND e.EhEtapaFinal = 1
                    WHERE h.Tipo = 'E'
                      AND MONTH(h.DataHoraAcao) = MONTH(GETDATE())
                      AND YEAR(h.DataHoraAcao) = YEAR(GETDATE())
                ";
            }
            dto.ConcluidasMes = Convert.ToInt32(await cmd.ExecuteScalarAsync() ?? 0);

            // Sem responsável (admin global)
            if (incluirSemResponsavel)
            {
                cmd.Parameters.Clear();
                cmd.CommandText = @"
                    SELECT COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    WHERE t.ColaboradorResponsavelId IS NULL
                ";
                dto.SemResponsavel = Convert.ToInt32(await cmd.ExecuteScalarAsync() ?? 0);
            }

            // Por etapa
            cmd.Parameters.Clear();
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT e.Nome, e.Ordem, e.EhEtapaFinal, COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    INNER JOIN Etapa e ON e.Id = t.EtapaId
                    WHERE t.ColaboradorResponsavelId = @ColaboradorId AND t.EtapaId IS NOT NULL
                    GROUP BY e.Id, e.Nome, e.Ordem, e.EhEtapaFinal
                    ORDER BY e.Ordem
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT e.Nome, e.Ordem, e.EhEtapaFinal, COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    INNER JOIN Etapa e ON e.Id = t.EtapaId
                    WHERE t.EtapaId IS NOT NULL
                    GROUP BY e.Id, e.Nome, e.Ordem, e.EhEtapaFinal
                    ORDER BY e.Ordem
                ";
            }
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.PorEtapa.Add(new TarefaPorEtapaDTO
                    {
                        Etapa = reader.GetString(0),
                        Ordem = reader.GetInt32(1),
                        EhEtapaFinal = reader.GetBoolean(2),
                        Total = reader.GetInt32(3)
                    });
                }
            }

            // Por prioridade
            cmd.Parameters.Clear();
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT p.Nome, p.Cor, p.Ordem, COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    INNER JOIN Prioridade p ON p.Id = t.PrioridadeId
                    WHERE t.ColaboradorResponsavelId = @ColaboradorId
                    GROUP BY p.Id, p.Nome, p.Cor, p.Ordem
                    ORDER BY p.Ordem
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT p.Nome, p.Cor, p.Ordem, COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    INNER JOIN Prioridade p ON p.Id = t.PrioridadeId
                    GROUP BY p.Id, p.Nome, p.Cor, p.Ordem
                    ORDER BY p.Ordem
                ";
            }
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.PorPrioridade.Add(new TarefaPorPrioridadeDTO
                    {
                        Prioridade = reader.GetString(0),
                        Cor = reader.GetString(1),
                        Ordem = reader.GetInt32(2),
                        Total = reader.GetInt32(3)
                    });
                }
            }

            // Tarefas no backlog (sem etapa definida)
            cmd.Parameters.Clear();
            if (filtrarPorColaborador)
            {
                cmd.CommandText = @"
                    SELECT COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    WHERE t.EtapaId IS NULL AND t.ColaboradorResponsavelId = @ColaboradorId
                ";
                cmd.Parameters.AddWithValue("@ColaboradorId", colaboradorId);
            }
            else
            {
                cmd.CommandText = @"
                    SELECT COUNT(t.Id)
                    FROM ProjetoTarefa t
                    INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                    WHERE t.EtapaId IS NULL
                ";
            }
            dto.TarefasBacklog = Convert.ToInt32(await cmd.ExecuteScalarAsync() ?? 0);

            return dto;
        }

        private async Task<DashboardProjetosDTO> ObterProjetosAsync(SqlConnection con)
        {
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT
                    SUM(CASE WHEN Ativo = 1 AND Concluido = 0 THEN 1 ELSE 0 END),
                    SUM(CASE WHEN Concluido = 1
                              AND MONTH(DataCadastro) = MONTH(GETDATE())
                              AND YEAR(DataCadastro) = YEAR(GETDATE()) THEN 1 ELSE 0 END),
                    SUM(CASE WHEN CAST(DataCadastro AS DATE) = CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END)
                FROM Projeto
            ";

            await using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new DashboardProjetosDTO
                {
                    Ativos = reader.IsDBNull(0) ? 0 : reader.GetInt32(0),
                    ConcluidosMes = reader.IsDBNull(1) ? 0 : reader.GetInt32(1),
                    CadastradosHoje = reader.IsDBNull(2) ? 0 : reader.GetInt32(2)
                };
            }

            return new DashboardProjetosDTO();
        }

        private async Task<DashboardColaboradoresDTO> ObterColaboradoresAsync(SqlConnection con)
        {
            var dto = new DashboardColaboradoresDTO();
            await using var cmd = con.CreateCommand();

            // Top 5 por atendimentos realizados este mês
            cmd.CommandText = @"
                SELECT TOP 5 c.Nome, COUNT(a.Id)
                FROM Atendimento a
                INNER JOIN AtendimentoColaborador ac ON ac.AtendimentoId = a.Id
                INNER JOIN Colaborador c ON c.Id = ac.ColaboradorId
                WHERE a.Status = 'R'
                  AND MONTH(a.DataHoraConclusao) = MONTH(GETDATE())
                  AND YEAR(a.DataHoraConclusao) = YEAR(GETDATE())
                GROUP BY c.Id, c.Nome
                ORDER BY 2 DESC
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.TopAtendimentosMes.Add(new TopColaboradorDTO
                    {
                        Nome = reader.GetString(0),
                        Total = reader.GetInt32(1)
                    });
                }
            }

            // Top 5 com mais tarefas atribuídas em projetos ativos
            cmd.CommandText = @"
                SELECT TOP 5 c.Nome, COUNT(t.Id)
                FROM ProjetoTarefa t
                INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                INNER JOIN Colaborador c ON c.Id = t.ColaboradorResponsavelId
                GROUP BY c.Id, c.Nome
                ORDER BY 2 DESC
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.TopTarefasAtribuidas.Add(new TopColaboradorDTO
                    {
                        Nome = reader.GetString(0),
                        Total = reader.GetInt32(1)
                    });
                }
            }

            // Top 5 por tarefas concluídas este mês: movidas para etapa final, creditado ao responsável
            cmd.CommandText = @"
                SELECT TOP 5 c.Nome, COUNT(h.Id)
                FROM ProjetoTarefaHistorico h
                INNER JOIN Etapa e ON e.Id = h.EtapaId AND e.EhEtapaFinal = 1
                INNER JOIN ProjetoTarefa t ON t.Id = h.TarefaId
                INNER JOIN Colaborador c ON c.Id = t.ColaboradorResponsavelId
                WHERE h.Tipo = 'E'
                  AND MONTH(h.DataHoraAcao) = MONTH(GETDATE())
                  AND YEAR(h.DataHoraAcao) = YEAR(GETDATE())
                GROUP BY c.Id, c.Nome
                ORDER BY 2 DESC
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.TopTarefasConcluidas.Add(new TopColaboradorDTO
                    {
                        Nome = reader.GetString(0),
                        Total = reader.GetInt32(1)
                    });
                }
            }

            // Colaboradores sem nenhuma tarefa em projeto ativo
            cmd.CommandText = @"
                SELECT c.Id, c.Nome, ISNULL(s.Nome, '') as SetorNome
                FROM Colaborador c
                LEFT JOIN Setor s ON s.Id = c.SetorId
                WHERE c.Ativo = 1
                  AND NOT EXISTS (
                      SELECT 1
                      FROM ProjetoTarefa t
                      INNER JOIN Projeto pr ON pr.Id = t.ProjetoId AND pr.Ativo = 1 AND pr.Concluido = 0
                      WHERE t.ColaboradorResponsavelId = c.Id
                  )
                ORDER BY c.Nome
            ";
            await using (var reader = await cmd.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    dto.SemTarefasAtribuidas.Add(new ColaboradorOciosoDTO
                    {
                        Id = reader.GetInt32(0),
                        Nome = reader.GetString(1),
                        SetorNome = reader.GetString(2)
                    });
                }
            }

            return dto;
        }

        private async Task<List<ProjetoSemMovimentacaoDTO>> ObterProjetosSemMovimentacaoAsync(SqlConnection con)
        {
            await using var cmd = con.CreateCommand();
            cmd.CommandText = @"
                SELECT p.Id, p.Titulo, c.Nome,
                       MAX(h.DataHoraAcao) as UltimaMovimentacao,
                       DATEDIFF(DAY, MAX(h.DataHoraAcao), GETDATE()) as DiasParado
                FROM Projeto p
                INNER JOIN Cliente c ON c.Id = p.ClienteId
                LEFT JOIN ProjetoTarefa t ON t.ProjetoId = p.Id
                LEFT JOIN ProjetoTarefaHistorico h ON h.TarefaId = t.Id
                WHERE p.Ativo = 1 AND p.Concluido = 0
                GROUP BY p.Id, p.Titulo, c.Nome, p.DataCadastro
                HAVING MAX(h.DataHoraAcao) < DATEADD(DAY, -15, GETDATE())
                    OR (MAX(h.DataHoraAcao) IS NULL AND p.DataCadastro < DATEADD(DAY, -15, GETDATE()))
                ORDER BY UltimaMovimentacao ASC
            ";

            var lista = new List<ProjetoSemMovimentacaoDTO>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                lista.Add(new ProjetoSemMovimentacaoDTO
                {
                    Id = reader.GetInt32(0),
                    Titulo = reader.GetString(1),
                    ClienteNome = reader.GetString(2),
                    UltimaMovimentacao = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    DiasParado = reader.IsDBNull(4) ? 999 : reader.GetInt32(4)
                });
            }
            return lista;
        }

        private async Task<List<ColaboradorFiltroItemDTO>> ObterColaboradoresDisponiveisAsync(SqlConnection con)
        {
            await using var cmd = con.CreateCommand();
            cmd.CommandText = "SELECT Id, Nome FROM Colaborador WHERE Ativo = 1 ORDER BY Nome";

            var lista = new List<ColaboradorFiltroItemDTO>();
            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                lista.Add(new ColaboradorFiltroItemDTO
                {
                    Id = reader.GetInt32(0),
                    Nome = reader.GetString(1)
                });
            }
            return lista;
        }
    }
}
