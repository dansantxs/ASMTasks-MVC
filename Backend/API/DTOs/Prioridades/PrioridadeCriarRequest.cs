using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Prioridades
{
    public class PrioridadeCriarRequest
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descricao { get; set; }

        [Required]
        [StringLength(7)]
        public string Cor { get; set; } = string.Empty;

        [Range(0, 9999)]
        public int Ordem { get; set; }
    }
}
