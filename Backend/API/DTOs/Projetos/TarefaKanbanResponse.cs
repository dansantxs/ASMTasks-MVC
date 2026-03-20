namespace API.DTOs.Projetos
{
    public class TarefaKanbanResponse
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoTitulo { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
        public string PrioridadeNome { get; set; } = string.Empty;
        public string? PrioridadeCor { get; set; }
        public int PrioridadeOrdem { get; set; }
        public int? ColaboradorResponsavelId { get; set; }
        public string? ColaboradorResponsavelNome { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }
    }
}
