using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Auth
{
    public class LoginRequest
    {
        [Required]
        [StringLength(150)]
        public string Login { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string Senha { get; set; } = string.Empty;
    }
}
