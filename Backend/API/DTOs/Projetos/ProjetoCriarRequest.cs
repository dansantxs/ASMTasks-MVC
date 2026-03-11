namespace API.DTOs.Projetos
{
    public class ProjetoCriarRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int SetorId { get; set; }
        public List<ProjetoTarefaCriarRequest> Tarefas { get; set; } = new List<ProjetoTarefaCriarRequest>();
    }
}
