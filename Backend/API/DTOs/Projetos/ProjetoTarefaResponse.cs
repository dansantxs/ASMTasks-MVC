namespace API.DTOs.Projetos
{
    public class ProjetoTarefaResponse
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
        public int? ColaboradorResponsavelId { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }
        public int? SetorId { get; set; }
        public int QuantidadeAnexos { get; set; }
        public int? TempoExecucaoValor { get; set; }
        public string? TempoExecucaoUnidade { get; set; }
        public int? TempoTesteValor { get; set; }
        public string? TempoTesteUnidade { get; set; }
    }
}
