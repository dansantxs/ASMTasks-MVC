namespace API.DTOs.Cargos
{
    public class CargoCriarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
}