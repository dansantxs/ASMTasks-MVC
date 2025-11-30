namespace API.DTOs.Prioridades
{
    public class PrioridadeCriarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Cor { get; set; } = string.Empty;
    }
}