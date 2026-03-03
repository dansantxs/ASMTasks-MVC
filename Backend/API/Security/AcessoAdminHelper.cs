using API.DB;
using API.Models;
using System.Security.Claims;

namespace API.Security
{
    public static class AcessoAdminHelper
    {
        public static async Task<bool> UsuarioTemPermissaoAsync(ClaimsPrincipal user, DBContext dbContext, string permissao)
        {
            var usuarioIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(usuarioIdClaim, out var usuarioId))
                return false;

            await NivelAcesso.SincronizarPadroesAsync(dbContext);

            var usuario = await Usuario.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null || !usuario.Ativo)
                return false;

            return usuario.Permissoes.Contains(permissao, StringComparer.OrdinalIgnoreCase);
        }
    }
}
