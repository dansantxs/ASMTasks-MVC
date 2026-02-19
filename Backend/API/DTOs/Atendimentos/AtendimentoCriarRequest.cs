namespace API.DTOs.Atendimentos
{
    public class AtendimentoCriarRequest
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int CadastradoPorColaboradorId { get; set; }
        public DateTime DataHoraInicio { get; set; }
        public DateTime? DataHoraFim { get; set; }
        public List<int> ColaboradoresIds { get; set; } = new List<int>();
    }
}
