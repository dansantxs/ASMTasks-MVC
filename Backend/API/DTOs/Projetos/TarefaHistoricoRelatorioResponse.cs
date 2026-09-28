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
    }
}
