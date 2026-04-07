namespace API.DTOs.Projetos
{
    public class TarefaHistoricoRelatorioResponse
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public string TarefaTitulo { get; set; } = string.Empty;
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
    }
}
