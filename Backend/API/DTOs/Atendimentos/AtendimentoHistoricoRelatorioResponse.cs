namespace API.DTOs.Atendimentos
{
    public class AtendimentoHistoricoRelatorioResponse
    {
        public int Id { get; set; }
        public int AtendimentoId { get; set; }
        public string AtendimentoTitulo { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public char Tipo { get; set; }
        public int ColaboradorId { get; set; }
        public string ColaboradorNome { get; set; } = string.Empty;
        public DateTime DataHoraAcao { get; set; }
        public string? Observacao { get; set; }
        public char AtendimentoStatusAtual { get; set; }
    }
}
