namespace API.DTOs.Prioridades
{
    public class PrioridadeAtualizarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Cor { get; set; } = string.Empty;
    }
}