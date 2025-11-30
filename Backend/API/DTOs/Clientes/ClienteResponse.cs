namespace API.DTOs.Clientes
{
    public class ClienteResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;
        public char TipoPessoa { get; set; }
        public string? RG { get; set; }
        public string? InscricaoEstadual { get; set; }
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? CEP { get; set; }
        public string? Cidade { get; set; }
        public string? UF { get; set; }
        public string? Logradouro { get; set; }
        public string? Bairro { get; set; }
        public int? Numero { get; set; }
        public string? Site { get; set; }
        public DateTime? DataReferencia { get; set; }
        public bool Ativo { get; set; }
    }
}