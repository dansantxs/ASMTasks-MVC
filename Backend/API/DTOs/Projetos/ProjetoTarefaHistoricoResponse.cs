namespace API.DTOs.Projetos
{
    public class ProjetoTarefaHistoricoResponse
    {
        public int Id { get; set; }
        public char Tipo { get; set; }
        public int? ColaboradorId { get; set; }
        public string? ColaboradorNome { get; set; }
        public int? EtapaId { get; set; }
        public string? EtapaNome { get; set; }
        public string? Observacao { get; set; }
        public DateTime DataHoraAcao { get; set; }
    }
}
