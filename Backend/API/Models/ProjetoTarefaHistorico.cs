namespace API.Models
{
    public class ProjetoTarefaHistorico
    {
        public int Id { get; set; }
        public int TarefaId { get; set; }
        public char Tipo { get; set; } // 'E' = Mudança de Etapa, 'A' = Atribuição de Colaborador, 'I' = Início da Elaboração, 'P' = Pausada
        public int? ColaboradorId { get; set; }
        public string? ColaboradorNome { get; set; }
        public int? EtapaId { get; set; }
        public string? EtapaNome { get; set; }
        public string? Observacao { get; set; }
        public DateTime DataHoraAcao { get; set; }
    }
}
