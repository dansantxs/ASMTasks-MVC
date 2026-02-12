namespace API.DTOs.Cargos
{
    public class CargoResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; }
        public bool PossuiColaboradoresAtivos { get; set; }
        public bool PossuiTarefasAtivas { get; set; }
    }
}
