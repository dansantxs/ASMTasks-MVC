using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Atendimentos
{
    public class AtendimentoCriarRequest
    {
        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [StringLength(2000)]
        public string? Descricao { get; set; }

        [Range(1, int.MaxValue)]
        public int ClienteId { get; set; }

        public DateTime DataHoraInicio { get; set; }
        public DateTime? DataHoraFim { get; set; }
        public List<int> ColaboradoresIds { get; set; } = new List<int>();
        public List<int> NotificacoesMinutosAntecedencia { get; set; } = new List<int>();
    }
}
