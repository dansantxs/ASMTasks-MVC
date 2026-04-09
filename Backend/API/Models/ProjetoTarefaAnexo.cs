namespace API.Models
{
    public class ProjetoTarefaAnexo
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public string NomeOriginal { get; set; } = string.Empty;
        public string NomeArquivo { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long Tamanho { get; set; }
        public DateTime DataUpload { get; set; }
        public int EnviadoPorColaboradorId { get; set; }
    }
}
