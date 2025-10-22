namespace API.DTOs.Cargos
{
    public class CargoAtualizarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
    }
}