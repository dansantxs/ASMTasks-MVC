using API.DAOs;
using API.DTOs.EtapasDesenvolvimento;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Gerencia as etapas de desenvolvimento do sistema.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class EtapasController : ControllerBase
    {
        private readonly DbContext _dbContext;

        public EtapasController(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria uma nova etapa de desenvolvimento.
        /// </summary>
        /// <param name="request">Dados da etapa a ser criada.</param>
        /// <returns>Retorna o ID da nova etapa criada.</returns>
        /// <response code="201">Etapa criada com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Criar([FromBody] EtapaCriarRequest request)
        {
            try
            {
                var etapa = new Etapa
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao
                };

                var id = await etapa.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, id);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Atualiza uma etapa existente.
        /// </summary>
        /// <param name="id">ID da etapa.</param>
        /// <param name="request">Dados atualizados da etapa.</param>
        /// <response code="204">Etapa atualizada com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] EtapaAtualizarRequest request)
        {
            try
            {
                var etapa = new Etapa
                {
                    Id = id,
                    Nome = request.Nome,
                    Descricao = request.Descricao
                };

                await etapa.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Inativa uma etapa (soft delete).
        /// </summary>
        /// <param name="id">ID da etapa a ser inativada.</param>
        /// <response code="204">Etapa inativada com sucesso.</response>
        /// <response code="404">Etapa não encontrada.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var etapa = new Etapa { Id = id };
                await etapa.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Reativa uma etapa previamente inativada.
        /// </summary>
        /// <param name="id">ID da etapa.</param>
        /// <response code="204">Etapa reativada com sucesso.</response>
        /// <response code="404">Etapa não encontrada.</response>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var etapa = new Etapa { Id = id };
                await etapa.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Retorna todas as etapas cadastradas.
        /// </summary>
        /// <returns>Lista de etapas.</returns>
        /// <response code="200">Lista retornada com sucesso.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterTodos()
        {
            var etapas = await Etapa.ObterTodosAsync(_dbContext);
            return Ok(etapas);
        }

        /// <summary>
        /// Busca uma etapa pelo ID.
        /// </summary>
        /// <param name="id">ID da etapa.</param>
        /// <response code="200">Etapa encontrada.</response>
        /// <response code="404">Etapa não encontrada.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var etapa = await Etapa.ObterPorIdAsync(_dbContext, id);
            if (etapa == null)
                return NotFound("Etapa de Desenvolvimento não encontrada.");

            return Ok(etapa);
        }
    }
}