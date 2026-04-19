namespace API.DTOs.Projetos
{
    public class ProjetoDocumentoTarefaResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string PrioridadeNome { get; set; } = string.Empty;
        public string? PrioridadeCor { get; set; }
        public string? ColaboradorResponsavelNome { get; set; }
        public string? EtapaNome { get; set; }
    }
}
