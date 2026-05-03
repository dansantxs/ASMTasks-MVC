using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Etapas
{
    public class EtapaOrdemItem
    {
        [Range(1, int.MaxValue)]
        public int Id { get; set; }

        [Range(0, 9999)]
        public int Ordem { get; set; }
    }
}
