namespace API.DTOs.Projetos
{
    public class ProjetoHistoricoResponse
    {
        public int Id { get; set; }
        public char Tipo { get; set; } // 'C' = Conclusão, 'R' = Reabertura
        public int? RealizadoPorColaboradorId { get; set; }
        public string? RealizadoPorColaboradorNome { get; set; }
        public DateTime DataHoraAcao { get; set; }
    }
}
