using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Projetos
{
    public class ProjetoTarefaAtualizarRequest
    {
        public int? Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Descricao { get; set; }

        [Range(1, int.MaxValue)]
        public int PrioridadeId { get; set; }

        [Range(1, int.MaxValue)]
        public int? SetorId { get; set; }

        [Range(1, int.MaxValue)]
        public int? TempoExecucaoValor { get; set; }
        public string? TempoExecucaoUnidade { get; set; }

        [Range(1, int.MaxValue)]
        public int? TempoTesteValor { get; set; }
        public string? TempoTesteUnidade { get; set; }
    }
}
