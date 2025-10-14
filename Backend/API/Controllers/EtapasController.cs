using API.DAOs;
using API.DTOs.EtapasDesenvolvimento;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
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

        [HttpPost]
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

        [HttpPut("{id}")]
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

        [HttpDelete("{id}")]
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

        [HttpPut("{id}/reativar")]
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

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var etapas = await Etapa.ObterTodosAsync(_dbContext);
            return Ok(etapas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var etapa = await Etapa.ObterPorIdAsync(_dbContext, id);
            if (etapa == null)
                return NotFound("Etapa de Desenvolvimento não encontrada.");

            return Ok(etapa);
        }
    }
}