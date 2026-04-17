namespace API.DTOs.Auth
{
    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiraEm { get; set; }
        public int UsuarioId { get; set; }
        public int ColaboradorId { get; set; }
        public string ColaboradorNome { get; set; } = string.Empty;
        public int NivelAcesso { get; set; }
        public List<string> Permissoes { get; set; } = new();
        public bool EhAdministrador { get; set; }
    }
}
