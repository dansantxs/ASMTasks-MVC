using API.DB;
using API.DTOs.Notificacoes;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class NotificacoesController(DBContext dbContext) : ControllerBase
    {

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ObterMinhas([FromQuery] int limite = 50)
        {
            try
            {
                var colaboradorId = ObterColaboradorIdLogado();
                var notificacoes = await NotificacaoSistema.ObterPorColaboradorAsync(dbContext, colaboradorId, limite);
                var quantidadeNaoLidas = await NotificacaoSistema.ObterQuantidadeNaoLidasAsync(dbContext, colaboradorId);

                var response = new NotificacaoSistemaListaResponse
                {
                    QuantidadeNaoLidas = quantidadeNaoLidas,
                    Itens = notificacoes.Select(Mapear).ToList()
                };

                return Ok(response);
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPut("{id}/lida")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> MarcarComoLida(int id)
        {
            try
            {
                var colaboradorId = ObterColaboradorIdLogado();
                var marcada = await NotificacaoSistema.MarcarComoLidaAsync(dbContext, id, colaboradorId);
                if (!marcada)
                    return NotFound(new { erro = "Notificacao nao encontrada." });

                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        private int ObterColaboradorIdLogado()
        {
            var claim = User.FindFirstValue("colaboradorId");
            if (!int.TryParse(claim, out var colaboradorId) || colaboradorId <= 0)
                throw new ValidationException("Token invalido para identificar colaborador.");

            return colaboradorId;
        }

        private static NotificacaoSistemaResponse Mapear(NotificacaoSistema notificacao)
        {
            return new NotificacaoSistemaResponse
            {
                Id = notificacao.Id,
                AtendimentoId = notificacao.AtendimentoId,
                MinutosAntecedencia = notificacao.MinutosAntecedencia,
                Titulo = notificacao.Titulo,
                Mensagem = notificacao.Mensagem,
                DataNotificacao = notificacao.DataNotificacao,
                Lida = notificacao.Lida,
                DataLeitura = notificacao.DataLeitura,
                DataCadastro = notificacao.DataCadastro
            };
        }
    }
}
