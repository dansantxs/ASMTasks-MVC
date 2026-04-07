namespace API.DTOs.Projetos
{
    public class ProjetoHistoricoRelatorioResponse
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoTitulo { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public char Tipo { get; set; } // 'C' = Conclusão, 'R' = Reabertura
        public int? RealizadoPorColaboradorId { get; set; }
        public string? RealizadoPorColaboradorNome { get; set; }
        public DateTime DataHoraAcao { get; set; }
    }
}
