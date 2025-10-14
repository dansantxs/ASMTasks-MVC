namespace API.DTOs.EtapasDesenvolvimento
{
    public class EtapaAtualizarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
}