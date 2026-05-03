using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Projetos
{
    public class ProjetoTarefaCriarRequest
    {
        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Descricao { get; set; }

        [Range(1, int.MaxValue)]
        public int PrioridadeId { get; set; }

        public int? ColaboradorResponsavelId { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }
    }
}
