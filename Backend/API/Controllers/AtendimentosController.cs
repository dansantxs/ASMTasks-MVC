using API.DB;
using API.DTOs.Atendimentos;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    [Authorize]
    public class AtendimentosController(DBContext dbContext) : ControllerBase
    {

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] AtendimentoCriarRequest request)
        {
            try
            {
                var atendimento = new Atendimento
                {
                    Titulo = request.Titulo,
                    Descricao = request.Descricao,
                    ClienteId = request.ClienteId,
                    CadastradoPorColaboradorId = ObterColaboradorIdLogado(),
                    DataHoraInicio = request.DataHoraInicio,
                    DataHoraFim = request.DataHoraFim,
                    ColaboradoresIds = request.ColaboradoresIds,
                    NotificacoesMinutosAntecedencia = request.NotificacoesMinutosAntecedencia
                };

                var id = await atendimento.CriarAsync(dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Atendimento criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao criar o atendimento.", detalhe = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] AtendimentoAtualizarRequest request)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(dbContext, id, aplicarAutoFinalizacao: false);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                atendimento.Titulo = request.Titulo;
                atendimento.Descricao = request.Descricao;
                atendimento.ClienteId = request.ClienteId;
                atendimento.DataHoraInicio = request.DataHoraInicio;
                atendimento.DataHoraFim = request.DataHoraFim;
                atendimento.ColaboradoresIds = request.ColaboradoresIds;
                atendimento.NotificacoesMinutosAntecedencia = request.NotificacoesMinutosAntecedencia;

                await atendimento.AtualizarAsync(dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao atualizar o atendimento.", detalhe = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Excluir(int id)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.ExcluirAsync(dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao excluir o atendimento.", detalhe = ex.Message });
            }
        }

        [HttpPut("{id}/realizar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MarcarComoRealizado(
            int id,
            [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] AtendimentoMarcarRealizadoRequest? request)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.MarcarComoRealizadoAsync(
                    dbContext,
                    ObterColaboradorIdLogado(),
                    request?.ObservacaoConclusao);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao atualizar status do atendimento.", detalhe = ex.Message });
            }
        }

        private int ObterColaboradorIdLogado()
        {
            var claim = User.FindFirstValue("colaboradorId");
            if (!int.TryParse(claim, out var colaboradorId) || colaboradorId <= 0)
                throw new ValidationException("Token invalido para identificar colaborador.");

            return colaboradorId;
        }

        [HttpPut("{id}/agendar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MarcarComoAgendado(int id)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.MarcarComoAgendadoAsync(
                    dbContext,
                    ObterColaboradorIdLogado());
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao atualizar status do atendimento.", detalhe = ex.Message });
            }
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos([FromQuery] DateTime? dataInicio = null, [FromQuery] DateTime? dataFim = null)
        {
            var atendimentos = await Atendimento.ObterTodosAsync(dbContext, dataInicio, dataFim);
            if (atendimentos == null || !atendimentos.Any())
                return NoContent();

            var response = atendimentos.Select(a => new AtendimentoResponse
            {
                Id = a.Id,
                Titulo = a.Titulo,
                Descricao = a.Descricao,
                ClienteId = a.ClienteId,
                CadastradoPorColaboradorId = a.CadastradoPorColaboradorId,
                DataHoraInicio = a.DataHoraInicio,
                DataHoraFim = a.DataHoraFim,
                Status = a.Status,
                ObservacaoConclusao = a.ObservacaoConclusao,
                ConcluidoPorColaboradorId = a.ConcluidoPorColaboradorId,
                DataHoraConclusao = a.DataHoraConclusao,
                DataCadastro = a.DataCadastro,
                ColaboradoresIds = a.ColaboradoresIds,
                NotificacoesMinutosAntecedencia = a.NotificacoesMinutosAntecedencia,
                HistoricoStatus = MapearHistoricoStatus(a)
            });

            return Ok(response);
        }

        [HttpGet("historico-acoes")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ObterHistoricoAcoes(
            [FromQuery] DateTime? dataInicio = null,
            [FromQuery] DateTime? dataFim = null,
            [FromQuery] string? tipo = null,
            [FromQuery] int? colaboradorId = null,
            [FromQuery] int? clienteId = null,
            [FromQuery] int? atendimentoId = null)
        {
            char? tipoChar = null;
            if (!string.IsNullOrWhiteSpace(tipo))
            {
                var tipoNormalizado = tipo.Trim().ToUpperInvariant();
                if (tipoNormalizado != "C" && tipoNormalizado != "R")
                    return BadRequest(new { erro = "O parametro 'tipo' deve ser 'C' (conclusao) ou 'R' (reabertura)." });

                tipoChar = tipoNormalizado[0];
            }

            var historico = await Atendimento.ObterHistoricoStatusRelatorioAsync(
                dbContext,
                dataInicio,
                dataFim,
                tipoChar,
                colaboradorId,
                clienteId,
                atendimentoId);

            if (historico == null || !historico.Any())
                return NoContent();

            var response = historico.Select(item => new AtendimentoHistoricoRelatorioResponse
            {
                Id = item.Id,
                AtendimentoId = item.AtendimentoId,
                AtendimentoTitulo = item.AtendimentoTitulo,
                ClienteId = item.ClienteId,
                ClienteNome = item.ClienteNome,
                Tipo = item.Tipo,
                ColaboradorId = item.ColaboradorId,
                ColaboradorNome = item.ColaboradorNome,
                DataHoraAcao = item.DataHoraAcao,
                Observacao = item.Observacao,
                AtendimentoStatusAtual = item.AtendimentoStatusAtual
            });

            return Ok(response);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var a = await Atendimento.ObterPorIdAsync(dbContext, id);
            if (a == null)
                return NotFound(new { erro = "Atendimento nao encontrado." });

            var response = new AtendimentoResponse
            {
                Id = a.Id,
                Titulo = a.Titulo,
                Descricao = a.Descricao,
                ClienteId = a.ClienteId,
                CadastradoPorColaboradorId = a.CadastradoPorColaboradorId,
                DataHoraInicio = a.DataHoraInicio,
                DataHoraFim = a.DataHoraFim,
                Status = a.Status,
                ObservacaoConclusao = a.ObservacaoConclusao,
                ConcluidoPorColaboradorId = a.ConcluidoPorColaboradorId,
                DataHoraConclusao = a.DataHoraConclusao,
                DataCadastro = a.DataCadastro,
                ColaboradoresIds = a.ColaboradoresIds,
                NotificacoesMinutosAntecedencia = a.NotificacoesMinutosAntecedencia,
                HistoricoStatus = MapearHistoricoStatus(a)
            };

            return Ok(response);
        }

        private static List<AtendimentoHistoricoStatusResponse> MapearHistoricoStatus(Atendimento atendimento)
        {
            return atendimento.HistoricoStatus
                .Select(item => new AtendimentoHistoricoStatusResponse
                {
                    Id = item.Id,
                    Tipo = item.Tipo,
                    ColaboradorId = item.ColaboradorId,
                    ColaboradorNome = item.ColaboradorNome,
                    DataHoraAcao = item.DataHoraAcao,
                    Observacao = item.Observacao
                })
                .ToList();
        }
    }
}
