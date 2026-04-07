namespace API.Models
{
    public class ProjetoHistorico
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public char Tipo { get; set; } // 'C' = Conclusão, 'R' = Reabertura (desmarcar conclusão)
        public int? RealizadoPorColaboradorId { get; set; }
        public string? RealizadoPorColaboradorNome { get; set; }
        public DateTime DataHoraAcao { get; set; }
    }
}
