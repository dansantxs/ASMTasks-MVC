using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Projetos
{
    public class ProjetoDuplicarRequest
    {
        [Required]
        [MinLength(1)]
        public List<int> ClienteIds { get; set; } = new List<int>();
    }
}
