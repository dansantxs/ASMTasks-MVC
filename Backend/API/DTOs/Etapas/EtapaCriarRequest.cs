namespace API.DTOs.Etapas
{
    public class EtapaCriarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
}