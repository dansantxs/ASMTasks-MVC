using API.DB;
using API.Models;
using System.Security.Claims;

namespace API.Security
{
    public static class ConfiguracaoSistemaHelper
    {
        public static async Task<bool> UsuarioPodeEditarAsync(ClaimsPrincipal user, DBContext dbContext)
        {
            return await AcessoAdminHelper.UsuarioTemPermissaoAsync(user, dbContext, TelaPermissoes.ConfiguracoesSistema);
        }

        public static async Task<ConfiguracaoSistema> ObterAsync(DBContext dbContext)
        {
            return await ConfiguracaoSistema.ObterAsync(dbContext);
        }
    }
}
