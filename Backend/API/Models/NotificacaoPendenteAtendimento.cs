namespace API.Models
{
    public class NotificacaoPendenteAtendimento
    {
        public int ColaboradorId { get; set; }
        public string ColaboradorNome { get; set; } = string.Empty;
        public string? ColaboradorEmail { get; set; }
        public int AtendimentoId { get; set; }
        public string AtendimentoTitulo { get; set; } = string.Empty;
        public string ClienteNome { get; set; } = string.Empty;
        public DateTime DataHoraInicio { get; set; }
        public int MinutosAntecedencia { get; set; }
        public DateTime DataNotificacaoPrevista { get; set; }
    }
}
