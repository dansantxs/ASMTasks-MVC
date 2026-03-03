namespace API.DTOs.Usuarios
{
    public class UsuarioAtualizarDadosAdminRequest
    {
        public string NovoLogin { get; set; } = string.Empty;
        public string? NovaSenha { get; set; }
    }
}
