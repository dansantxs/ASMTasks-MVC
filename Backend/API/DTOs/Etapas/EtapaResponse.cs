namespace API.DTOs.Etapas
{
    public class EtapaResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; }
        public bool PossuiTarefasAtivas { get; set; }
        public int Ordem { get; set; }
        public bool EhEtapaFinal { get; set; }
    }
}
