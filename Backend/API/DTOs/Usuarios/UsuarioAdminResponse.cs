namespace API.DTOs.Usuarios
{
    public class UsuarioAdminResponse
    {
        public int Id { get; set; }
        public int ColaboradorId { get; set; }
        public string ColaboradorNome { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public string NivelAcesso { get; set; } = string.Empty;
        public bool ColaboradorAtivo { get; set; }
    }
}
