using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Clientes
{
    public class ClienteCriarRequest
    {
        [Required]
        [StringLength(200)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [StringLength(18)]
        public string Documento { get; set; } = string.Empty;

        public char TipoPessoa { get; set; }

        [StringLength(20)]
        public string? RG { get; set; }

        [StringLength(30)]
        public string? InscricaoEstadual { get; set; }

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }

        [StringLength(9)]
        public string? CEP { get; set; }

        [StringLength(100)]
        public string? Cidade { get; set; }

        [StringLength(2)]
        public string? UF { get; set; }

        [StringLength(200)]
        public string? Logradouro { get; set; }

        [StringLength(100)]
        public string? Bairro { get; set; }

        public int? Numero { get; set; }

        [StringLength(300)]
        public string? Site { get; set; }

        public DateTime? DataReferencia { get; set; }
    }
}
