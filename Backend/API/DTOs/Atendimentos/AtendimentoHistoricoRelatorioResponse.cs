namespace API.DTOs.Atendimentos
{
    public class AtendimentoHistoricoRelatorioResponse
    {
        public int Id { get; set; }
        public int AtendimentoId { get; set; }
        public string AtendimentoTitulo { get; set; } = string.Empty;
        public string? AtendimentoDescricao { get; set; }
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;

        /// <summary>Para a tela mostrar o cliente conforme a configuracao do sistema.</summary>
        public string? ClienteNomeFantasia { get; set; }
        public char Tipo { get; set; }
        public int ColaboradorId { get; set; }
        public string ColaboradorNome { get; set; } = string.Empty;
        public DateTime DataHoraAcao { get; set; }
        public string? Observacao { get; set; }
        public char AtendimentoStatusAtual { get; set; }
    }
}
