namespace API.DTOs.Etapas
{
    public class EtapaCriarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int Ordem { get; set; } = 0;
        public bool EhEtapaFinal { get; set; } = false;
    }
}