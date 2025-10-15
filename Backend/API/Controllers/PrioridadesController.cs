using API.DAOs;
using API.DTOs.Prioridades;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Gerencia os níveis de prioridade do sistema.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PrioridadesController : ControllerBase
    {
        private readonly DbContext _dbContext;

        public PrioridadesController(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria uma nova prioridade.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Criar([FromBody] PrioridadeCriarRequest request)
        {
            try
            {
                var prioridade = new Prioridade
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    Cor = request.Cor
                };

                var id = await prioridade.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, id);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Atualiza uma prioridade existente.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] PrioridadeAtualizarRequest request)
        {
            try
            {
                var prioridade = new Prioridade
                {
                    Id = id,
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    Cor = request.Cor
                };

                await prioridade.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Inativa uma prioridade.
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var prioridade = new Prioridade { Id = id };
                await prioridade.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Reativa uma prioridade inativada.
        /// </summary>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var prioridade = new Prioridade { Id = id };
                await prioridade.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Retorna todas as prioridades cadastradas.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterTodos()
        {
            var prioridades = await Prioridade.ObterTodosAsync(_dbContext);
            return Ok(prioridades);
        }

        /// <summary>
        /// Busca uma prioridade pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var prioridade = await Prioridade.ObterPorIdAsync(_dbContext, id);
            if (prioridade == null)
                return NotFound("Prioridade não encontrada.");

            return Ok(prioridade);
        }
    }
}