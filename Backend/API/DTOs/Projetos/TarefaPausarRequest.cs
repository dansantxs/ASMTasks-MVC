using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Projetos
{
    public class TarefaPausarRequest
    {
        [StringLength(1000)]
        public string? Observacao { get; set; }
    }
}
