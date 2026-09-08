using API.DB;
using API.DB.DAOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class DashboardController(DBContext dbContext, ILogger<DashboardController> logger) : ControllerBase
    {

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Obter([FromQuery] int? colaboradorId, [FromQuery] string? periodo)
        {
            try
            {
                var colaboradorIdLogado = ObterColaboradorIdLogado();
                var ehAdministrador = ObterEhAdministrador();

                // Usuários comuns só veem os próprios dados
                if (!ehAdministrador)
                    colaboradorId = null;

                var config = await new ConfiguracoesSistemaDAO().ObterAsync(dbContext);
                var dao = new DashboardDAO();
                var dashboard = await dao.ObterDashboardAsync(dbContext, colaboradorIdLogado, ehAdministrador, colaboradorId, periodo, config.ExibicaoNomeCliente);

                return Ok(dashboard);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                // Sem este log, um erro de SQL aqui vira um 500 mudo no navegador e não sobra
                // nada para investigar. A resposta segue genérica; o detalhe fica no log.
                logger.LogError(ex, "Erro ao obter o dashboard (colaboradorId={ColaboradorId}, periodo={Periodo})", colaboradorId, periodo);
                return StatusCode(500, new { erro = "Erro ao obter o dashboard." });
            }
        }

        private int ObterColaboradorIdLogado()
        {
            var claim = User.FindFirstValue("colaboradorId");
            if (!int.TryParse(claim, out var colaboradorId) || colaboradorId <= 0)
                throw new ValidationException("Token inválido.");
            return colaboradorId;
        }

        private bool ObterEhAdministrador()
        {
            var claim = User.FindFirstValue("ehAdministrador");
            return bool.TryParse(claim, out var ehAdmin) && ehAdmin;
        }
    }
}
