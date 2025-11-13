namespace API.DTOs.Clientes
{
    public class ClienteCriarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;  // CPF/CNPJ limpo ou com máscara
        public string TipoPessoa { get; set; } = string.Empty; // "F" ou "J"
        public string? RG { get; set; }                        // PF
        public string? InscricaoEstadual { get; set; }         // PJ
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? CEP { get; set; }
        public string? Cidade { get; set; }
        public string? UF { get; set; }
        public string? Logradouro { get; set; }
        public string? Bairro { get; set; }
        public int? Numero { get; set; }
    }
}
