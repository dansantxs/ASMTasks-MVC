using API.DAOs;
using API.DTOs.Prioridades;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
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

        [HttpPost]
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

        [HttpPut("{id}")]
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

        [HttpDelete("{id}")]
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

        [HttpPut("{id}/reativar")]
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

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            var prioridades = await Prioridade.ObterTodosAsync(_dbContext);
            return Ok(prioridades);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var prioridade = await Prioridade.ObterPorIdAsync(_dbContext, id);
            if (prioridade == null)
                return NotFound("Prioridade não encontrado.");

            return Ok(prioridade);
        }
    }
}