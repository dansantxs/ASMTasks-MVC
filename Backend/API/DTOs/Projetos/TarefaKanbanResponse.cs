namespace API.DTOs.Projetos
{
    public class TarefaKanbanResponse
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string ProjetoTitulo { get; set; } = string.Empty;
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
        public string PrioridadeNome { get; set; } = string.Empty;
        public string? PrioridadeCor { get; set; }
        public int PrioridadeOrdem { get; set; }
        public int? ColaboradorResponsavelId { get; set; }
        public string? ColaboradorResponsavelNome { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }
        public DateTime? DataHoraInicio { get; set; }
        public int? SetorId { get; set; }
    public int? CadastradoPorColaboradorId { get; set; }
    public string? CadastradoPorNome { get; set; }
    public DateTime? DataCadastro { get; set; }
    public int QuantidadeAnexos { get; set; }
    public string? ClienteNomeFantasia { get; set; }
    public string StatusAtual { get; set; } = "Ociosa";
    /// <summary>
    /// Quem estava responsavel na ultima passagem pela etapa de teste. Nulo se a tarefa nunca
    /// passou por ela (ou passou sem responsavel) - e o que o Kanban pre-seleciona ao devolve-la
    /// para o teste.
    /// </summary>
    public int? UltimoResponsavelTesteId { get; set; }
    /// <summary>A elaboração já foi iniciada alguma vez — separa Reservado de Em elaboração.</summary>
    public bool ElaboracaoJaIniciada { get; set; }
    public int? TempoExecucaoValor { get; set; }
    public string? TempoExecucaoUnidade { get; set; }
    public int? TempoTesteValor { get; set; }
    public string? TempoTesteUnidade { get; set; }
    }
}
