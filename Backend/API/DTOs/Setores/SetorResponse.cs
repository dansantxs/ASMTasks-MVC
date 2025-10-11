namespace API.DTOs.Setores
{
    public class SetorResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime CriadoEm { get; set; }
        public bool Ativo { get; set; }
        public int? ResponsavelId { get; set; }
        public string? ResponsavelNome { get; set; }
    }
}