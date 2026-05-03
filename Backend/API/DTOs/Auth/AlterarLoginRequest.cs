using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Auth
{
    public class AlterarLoginRequest
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string NovoLogin { get; set; } = string.Empty;
    }
}
