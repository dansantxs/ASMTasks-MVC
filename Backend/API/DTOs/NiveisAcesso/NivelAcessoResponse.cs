namespace API.DTOs.NiveisAcesso
{
    public class NivelAcessoResponse
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; }
        public bool EhAdministrador { get; set; }
        public List<string> Permissoes { get; set; } = new();
    }
}
