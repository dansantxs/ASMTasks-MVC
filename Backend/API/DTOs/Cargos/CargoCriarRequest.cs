using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Cargos
{
    public class CargoCriarRequest
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descricao { get; set; }
    }
}
