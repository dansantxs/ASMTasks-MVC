namespace API.DTOs.Prioridades
{
    public class PrioridadeResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Cor { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public bool PossuiTarefasAtivas { get; set; }
    }
}
