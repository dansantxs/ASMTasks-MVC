namespace API.DTOs.Projetos
{
    public class ProjetoTarefaCriarRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
        public int? ColaboradorResponsavelId { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }
    }
}
