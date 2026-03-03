namespace API.DTOs.NiveisAcesso
{
    public class NivelAcessoAtualizarRequest
    {
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool EhAdministrador { get; set; }
        public List<string> Permissoes { get; set; } = new();
    }
}
