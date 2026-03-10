namespace API.DTOs.Atendimentos
{
    public class AtendimentoHistoricoStatusResponse
    {
        public int Id { get; set; }
        public char Tipo { get; set; }
        public int ColaboradorId { get; set; }
        public string? ColaboradorNome { get; set; }
        public DateTime DataHoraAcao { get; set; }
        public string? Observacao { get; set; }
    }
}
