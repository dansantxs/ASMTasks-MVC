namespace API.DTOs.Projetos
{
    public class TarefaEmAndamentoResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string ProjetoTitulo { get; set; } = string.Empty;
        public DateTime DataHoraInicio { get; set; }
    }
}
