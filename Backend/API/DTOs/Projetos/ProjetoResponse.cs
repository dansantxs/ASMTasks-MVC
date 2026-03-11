namespace API.DTOs.Projetos
{
    public class ProjetoResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int CadastradoPorColaboradorId { get; set; }
        public DateTime DataCadastro { get; set; }
        public bool Ativo { get; set; }
        public int SetorId { get; set; }
        public List<ProjetoTarefaResponse> Tarefas { get; set; } = new List<ProjetoTarefaResponse>();
    }
}
