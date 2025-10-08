using API.DAOs;
using API.DTOs.Setores;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
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

        [HttpPost]
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

        [HttpPut("{id}")]
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

        [HttpDelete("{id}")]
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

        [HttpPut("{id}/reativar")]
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

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var setores = await Setor.ObterTodosAsync(_dbContext);
            return Ok(setores);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var setor = await Setor.ObterPorIdAsync(_dbContext, id);
            if (setor == null)
                return NotFound("Setor não encontrado.");

            return Ok(setor);
        }
    }
}
