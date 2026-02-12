using API.DB;
using API.DTOs.Prioridades;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Controlador responsável por gerenciar os níveis de prioridade do sistema.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class PrioridadesController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public PrioridadesController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria uma nova prioridade.
        /// </summary>
        /// <param name="request">Dados da prioridade a ser criada.</param>
        /// <returns>ID da prioridade criada.</returns>
        /// <response code="201">Prioridade criada com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="500">Erro interno ao criar a prioridade.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] PrioridadeCriarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var prioridade = new Prioridade
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    Cor = request.Cor
                };

                var id = await prioridade.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Prioridade criada com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao criar a prioridade." });
            }
        }

        /// <summary>
        /// Atualiza uma prioridade existente.
        /// </summary>
        /// <param name="id">ID da prioridade.</param>
        /// <param name="request">Dados atualizados da prioridade.</param>
        /// <response code="204">Prioridade atualizada com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="404">Prioridade não encontrada.</response>
        /// <response code="500">Erro interno ao atualizar a prioridade.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] PrioridadeAtualizarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var prioridade = await Prioridade.ObterPorIdAsync(_dbContext, id);
                if (prioridade == null)
                    return NotFound(new { erro = "Prioridade não encontrada." });

                prioridade.Nome = request.Nome;
                prioridade.Descricao = request.Descricao;
                prioridade.Cor = request.Cor;

                await prioridade.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao atualizar a prioridade." });
            }
        }

        /// <summary>
        /// Inativa uma prioridade (soft delete).
        /// </summary>
        /// <param name="id">ID da prioridade a ser inativada.</param>
        /// <response code="204">Prioridade inativada com sucesso.</response>
        /// <response code="404">Prioridade não encontrada.</response>
        /// <response code="500">Erro interno ao inativar a prioridade.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var prioridade = await Prioridade.ObterPorIdAsync(_dbContext, id);
                if (prioridade == null)
                    return NotFound(new { erro = "Prioridade não encontrada." });

                await prioridade.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao inativar a prioridade." });
            }
        }

        /// <summary>
        /// Reativa uma prioridade previamente inativada.
        /// </summary>
        /// <param name="id">ID da prioridade a ser reativada.</param>
        /// <response code="204">Prioridade reativada com sucesso.</response>
        /// <response code="404">Prioridade não encontrada.</response>
        /// <response code="500">Erro interno ao reativar a prioridade.</response>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var prioridade = await Prioridade.ObterPorIdAsync(_dbContext, id);
                if (prioridade == null)
                    return NotFound(new { erro = "Prioridade não encontrada." });

                await prioridade.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao reativar a prioridade." });
            }
        }

        /// <summary>
        /// Retorna todas as prioridades cadastradas.
        /// </summary>
        /// <returns>Lista de prioridades.</returns>
        /// <response code="200">Lista retornada com sucesso.</response>
        /// <response code="204">Nenhuma prioridade encontrada.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var prioridades = await Prioridade.ObterTodosAsync(_dbContext);
            if (prioridades == null || !prioridades.Any())
                return NoContent();

            var response = prioridades.Select(prioridade => new PrioridadeResponse
            {
                Id = prioridade.Id,
                Nome = prioridade.Nome,
                Descricao = prioridade.Descricao,
                Cor = prioridade.Cor,
                Ativo = prioridade.Ativo,
                PossuiTarefasAtivas = false
            });

            return Ok(response);
        }

        /// <summary>
        /// Busca uma prioridade específica pelo ID.
        /// </summary>
        /// <param name="id">ID da prioridade.</param>
        /// <returns>Dados da prioridade correspondente.</returns>
        /// <response code="200">Prioridade encontrada.</response>
        /// <response code="404">Prioridade não encontrada.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var prioridade = await Prioridade.ObterPorIdAsync(_dbContext, id);
            if (prioridade == null)
                return NotFound(new { erro = "Prioridade não encontrada." });

            var response = new PrioridadeResponse
            {
                Id = prioridade.Id,
                Nome = prioridade.Nome,
                Descricao = prioridade.Descricao,
                Cor = prioridade.Cor,
                Ativo = prioridade.Ativo,
                PossuiTarefasAtivas = false
            };

            return Ok(response);
        }
    }
}
