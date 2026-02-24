namespace API.DTOs.Atendimentos
{
    public class AtendimentoResponse
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int CadastradoPorColaboradorId { get; set; }
        public DateTime DataHoraInicio { get; set; }
        public DateTime? DataHoraFim { get; set; }
        public char Status { get; set; }
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }
        public List<int> ColaboradoresIds { get; set; } = new List<int>();
        public List<int> NotificacoesMinutosAntecedencia { get; set; } = new List<int>();
    }
}
