using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Usuarios
{
    public class UsuarioAtualizarDadosAdminRequest
    {
        [Required]
        [StringLength(150, MinimumLength = 3)]
        public string NovoLogin { get; set; } = string.Empty;

        [StringLength(255, MinimumLength = 6)]
        public string? NovaSenha { get; set; }
    }
}
