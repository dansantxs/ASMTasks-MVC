namespace API.DTOs.Projetos
{
    public class ProjetoTarefaAtualizarRequest
    {
        public int? Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
    }
}
