namespace API.DTOs.Colaboradores
{
    public class ColaboradorCriarResponse
    {
        public int Id { get; set; }
        public string Mensagem { get; set; } = string.Empty;
        public string? LoginGerado { get; set; }
    }
}
