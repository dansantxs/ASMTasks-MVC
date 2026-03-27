namespace API.DTOs.Projetos
{
    public class ProjetoAtualizarRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int SetorId { get; set; }
        public List<ProjetoTarefaAtualizarRequest> Tarefas { get; set; } = new List<ProjetoTarefaAtualizarRequest>();
    }
}
