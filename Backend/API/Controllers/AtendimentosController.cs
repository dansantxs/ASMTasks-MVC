using API.DB;
using API.DTOs.Atendimentos;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class AtendimentosController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public AtendimentosController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

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
                    CadastradoPorColaboradorId = request.CadastradoPorColaboradorId,
                    DataHoraInicio = request.DataHoraInicio,
                    DataHoraFim = request.DataHoraFim,
                    ColaboradoresIds = request.ColaboradoresIds
                };

                var id = await atendimento.CriarAsync(_dbContext);
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
                var atendimento = await Atendimento.ObterPorIdAsync(_dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                atendimento.Titulo = request.Titulo;
                atendimento.Descricao = request.Descricao;
                atendimento.ClienteId = request.ClienteId;
                atendimento.CadastradoPorColaboradorId = request.CadastradoPorColaboradorId;
                atendimento.DataHoraInicio = request.DataHoraInicio;
                atendimento.DataHoraFim = request.DataHoraFim;
                atendimento.ColaboradoresIds = request.ColaboradoresIds;

                await atendimento.AtualizarAsync(_dbContext);
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
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(_dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao inativar o atendimento.", detalhe = ex.Message });
            }
        }

        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(_dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao reativar o atendimento.", detalhe = ex.Message });
            }
        }

        [HttpPut("{id}/realizar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MarcarComoRealizado(int id)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(_dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.MarcarComoRealizadoAsync(_dbContext);
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

        [HttpPut("{id}/agendar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MarcarComoAgendado(int id)
        {
            try
            {
                var atendimento = await Atendimento.ObterPorIdAsync(_dbContext, id);
                if (atendimento == null)
                    return NotFound(new { erro = "Atendimento nao encontrado." });

                await atendimento.MarcarComoAgendadoAsync(_dbContext);
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
            var atendimentos = await Atendimento.ObterTodosAsync(_dbContext, dataInicio, dataFim);
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
                Ativo = a.Ativo,
                DataCadastro = a.DataCadastro,
                ColaboradoresIds = a.ColaboradoresIds
            });

            return Ok(response);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var a = await Atendimento.ObterPorIdAsync(_dbContext, id);
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
                Ativo = a.Ativo,
                DataCadastro = a.DataCadastro,
                ColaboradoresIds = a.ColaboradoresIds
            };

            return Ok(response);
        }
    }
}
