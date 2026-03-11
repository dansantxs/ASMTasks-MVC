namespace API.DTOs.Projetos
{
    public class ProjetoTarefaResponse
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
        public int? ColaboradorResponsavelId { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }
    }
}
