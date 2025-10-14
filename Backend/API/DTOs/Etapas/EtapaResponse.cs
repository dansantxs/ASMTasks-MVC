namespace API.DTOs.EtapasDesenvolvimento
{
    public class EtapaResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime CriadoEm { get; set; }
        public bool Ativo { get; set; }
    }
}