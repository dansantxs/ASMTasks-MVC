using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Colaboradores
{
    public class ColaboradorCriarRequest
    {
        [Required]
        [StringLength(200)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [StringLength(14)]
        public string CPF { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; } = string.Empty;

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

        public DateTime DataNascimento { get; set; }
        public DateTime DataAdmissao { get; set; }

        [Range(1, int.MaxValue)]
        public int SetorId { get; set; }

        [Range(1, int.MaxValue)]
        public int CargoId { get; set; }
    }
}
