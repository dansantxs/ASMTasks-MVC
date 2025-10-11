namespace API.DTOs.Setores
{
    public class SetorCriarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int? ResponsavelId { get; set; }
    }
}