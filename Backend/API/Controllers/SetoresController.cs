using API.DAOs;
using API.DTOs.Setores;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Gerencia os setores e departamentos da organização.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class SetoresController : ControllerBase
    {
        private readonly DbContext _dbContext;

        public SetoresController(DbContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria um novo setor.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Criar([FromBody] SetorCriarRequest request)
        {
            try
            {
                var setor = new Setor
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    ResponsavelId = request.ResponsavelId
                };

                var id = await setor.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, id);
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Atualiza um setor existente.
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] SetorAtualizarRequest request)
        {
            try
            {
                var setor = new Setor
                {
                    Id = id,
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    ResponsavelId = request.ResponsavelId
                };

                await setor.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Inativa um setor.
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var setor = new Setor { Id = id };
                await setor.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Reativa um setor inativado.
        /// </summary>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var setor = new Setor { Id = id };
                await setor.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return NotFound(ex.Message);
            }
        }

        /// <summary>
        /// Retorna todos os setores cadastrados.
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterTodos()
        {
            var setores = await Setor.ObterTodosAsync(_dbContext);
            return Ok(setores);
        }

        /// <summary>
        /// Busca um setor pelo ID.
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var setor = await Setor.ObterPorIdAsync(_dbContext, id);
            if (setor == null)
                return NotFound("Setor não encontrado.");

            return Ok(setor);
        }
    }
}