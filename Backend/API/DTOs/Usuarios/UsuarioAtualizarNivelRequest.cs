using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Usuarios
{
    public class UsuarioAtualizarNivelRequest
    {
        [Range(1, int.MaxValue)]
        public int NivelAcesso { get; set; }
    }
}
