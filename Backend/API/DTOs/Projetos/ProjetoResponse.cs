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
        public int? AlteradoPorColaboradorId { get; set; }
        public DateTime? DataAlteracao { get; set; }
        public bool Ativo { get; set; }
        public bool Concluido { get; set; }
        public List<ProjetoTarefaResponse> Tarefas { get; set; } = new List<ProjetoTarefaResponse>();
    }
}
