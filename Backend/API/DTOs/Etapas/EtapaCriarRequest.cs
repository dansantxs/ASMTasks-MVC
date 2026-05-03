using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Etapas
{
    public class EtapaCriarRequest
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descricao { get; set; }

        [Range(0, 9999)]
        public int Ordem { get; set; } = 0;

        public bool EhEtapaFinal { get; set; } = false;
    }
}
