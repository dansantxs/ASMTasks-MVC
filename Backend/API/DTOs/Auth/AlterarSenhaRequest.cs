using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Auth
{
    public class AlterarSenhaRequest
    {
        [Required]
        [StringLength(255)]
        public string SenhaAtual { get; set; } = string.Empty;

        [Required]
        [StringLength(255, MinimumLength = 6)]
        public string NovaSenha { get; set; } = string.Empty;
    }
}
