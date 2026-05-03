using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Setores
{
    public class SetorCriarRequest
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descricao { get; set; }
    }
}
