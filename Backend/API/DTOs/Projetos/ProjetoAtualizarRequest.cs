using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Projetos
{
    public class ProjetoAtualizarRequest
    {
        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Descricao { get; set; }

        [Range(1, int.MaxValue)]
        public int ClienteId { get; set; }

        [Range(1, int.MaxValue)]
        public int SetorId { get; set; }

        public List<ProjetoTarefaAtualizarRequest> Tarefas { get; set; } = new List<ProjetoTarefaAtualizarRequest>();
    }
}
