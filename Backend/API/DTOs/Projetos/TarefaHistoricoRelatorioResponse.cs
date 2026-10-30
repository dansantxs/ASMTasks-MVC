namespace API.DTOs.Projetos
{
    public class TarefaHistoricoRelatorioResponse
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public string TarefaTitulo { get; set; } = string.Empty;
        public string? TarefaDescricao { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoTitulo { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public char Tipo { get; set; }
        public int? ColaboradorId { get; set; }
        public string? ColaboradorNome { get; set; }
        public int? EtapaId { get; set; }
        public string? EtapaNome { get; set; }
        public DateTime DataHoraAcao { get; set; }
        public int? RealizadoPorColaboradorId { get; set; }
        public string? RealizadoPorColaboradorNome { get; set; }
        public string? Observacao { get; set; }
        public string? ClienteNomeFantasia { get; set; }
        public int? CadastradoPorColaboradorId { get; set; }
        public string? CadastradoPorNome { get; set; }
        public DateTime? TarefaDataCadastro { get; set; }

        /// <summary>
        /// A elaboração já tinha sido iniciada até este evento. Falso numa mudança para a etapa de
        /// elaboração significa que a tarefa ficou reservada ali.
        /// </summary>
        public bool ElaboracaoJaIniciadaNoEvento { get; set; }

        /// <summary>
        /// Quem ficou com a tarefa ao entrar na etapa. O responsável gravado na linha de troca de
        /// etapa é o de ANTES da troca, então não serve para dizer de quem é a reserva.
        /// </summary>
        public int? ResponsavelReservaId { get; set; }

        public string? ResponsavelReservaNome { get; set; }

        /// <summary>Tempo previsto cadastrado na tarefa (valor + unidade D/H/M).</summary>
        public int? TempoExecucaoValor { get; set; }
        public string? TempoExecucaoUnidade { get; set; }
        public int? TempoTesteValor { get; set; }
        public string? TempoTesteUnidade { get; set; }

        /// <summary>
        /// Tempo realizado, em minutos, somado de todo o histórico da tarefa (não só do período
        /// consultado): elaboração e a parte dela que aconteceu dentro da etapa de teste.
        /// </summary>
        public int? MinutosElaboracao { get; set; }
        public int? MinutosTeste { get; set; }

        /// <summary>
        /// O evento casa com os filtros da consulta (período, tipo, colaborador...). Com o
        /// histórico completo, vêm também os eventos anteriores das mesmas tarefas, que chegam
        /// com false; sem ele, todo evento devolvido é true.
        /// </summary>
        public bool DentroDoFiltro { get; set; } = true;
    }
}
