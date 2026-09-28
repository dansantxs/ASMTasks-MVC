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
        /// <summary>'Em andamento', 'Pausada' ou 'Ociosa' — separa o Reservado da elaboração na tela.</summary>
        public string StatusAtual { get; set; } = "Ociosa";
        /// <summary>A elaboração já foi iniciada alguma vez — separa Reservado de Em elaboração.</summary>
        public bool ElaboracaoJaIniciada { get; set; }
    }
}
