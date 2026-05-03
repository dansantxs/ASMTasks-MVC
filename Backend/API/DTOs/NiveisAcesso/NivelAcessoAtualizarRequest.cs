using System.ComponentModel.DataAnnotations;

namespace API.DTOs.NiveisAcesso
{
    public class NivelAcessoAtualizarRequest
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descricao { get; set; }

        public bool EhAdministrador { get; set; }
        public List<string> Permissoes { get; set; } = new();
    }
}
