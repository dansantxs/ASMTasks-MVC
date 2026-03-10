namespace API.Models
{
    public class AtendimentoHistoricoStatus
    {
        public int Id { get; set; }
        public int AtendimentoId { get; set; }
        public char Tipo { get; set; }
        public int ColaboradorId { get; set; }
        public string? ColaboradorNome { get; set; }
        public DateTime DataHoraAcao { get; set; }
        public string? Observacao { get; set; }
    }
}
