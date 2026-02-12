using API.DB;
using API.DTOs.Cargos;
using API.DTOs.Etapas;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Controlador responsável por gerenciar as etapas de desenvolvimento do sistema.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class EtapasController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public EtapasController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria uma nova etapa de desenvolvimento.
        /// </summary>
        /// <param name="request">Dados da etapa a ser criada.</param>
        /// <returns>O ID da etapa criada.</returns>
        /// <response code="201">Etapa criada com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="500">Erro interno ao criar a etapa.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] EtapaCriarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var etapa = new Etapa
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao
                };

                var id = await etapa.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Etapa criada com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao criar a etapa." });
            }
        }

        /// <summary>
        /// Atualiza os dados de uma etapa existente.
        /// </summary>
        /// <param name="id">ID da etapa a ser atualizada.</param>
        /// <param name="request">Dados atualizados da etapa.</param>
        /// <response code="204">Etapa atualizada com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="404">Etapa não encontrada.</response>
        /// <response code="500">Erro interno ao atualizar a etapa.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] EtapaAtualizarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var etapa = await Etapa.ObterPorIdAsync(_dbContext, id);
                if (etapa == null)
                    return NotFound(new { erro = "Etapa não encontrada." });

                etapa.Nome = request.Nome;
                etapa.Descricao = request.Descricao;

                await etapa.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao atualizar a etapa." });
            }
        }

        /// <summary>
        /// Inativa uma etapa.
        /// </summary>
        /// <param name="id">ID da etapa a ser inativada.</param>
        /// <response code="204">Etapa inativada com sucesso.</response>
        /// <response code="404">Etapa não encontrada.</response>
        /// <response code="500">Erro interno ao inativar a etapa.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var etapa = await Etapa.ObterPorIdAsync(_dbContext, id);
                if (etapa == null)
                    return NotFound(new { erro = "Etapa não encontrada." });

                await etapa.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao inativar a etapa." });
            }
        }

        /// <summary>
        /// Reativa uma etapa previamente inativada.
        /// </summary>
        /// <param name="id">ID da etapa a ser reativada.</param>
        /// <response code="204">Etapa reativada com sucesso.</response>
        /// <response code="404">Etapa não encontrada.</response>
        /// <response code="500">Erro interno ao reativar a etapa.</response>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var etapa = await Etapa.ObterPorIdAsync(_dbContext, id);
                if (etapa == null)
                    return NotFound(new { erro = "Etapa não encontrada." });

                await etapa.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao reativar a etapa." });
            }
        }

        /// <summary>
        /// Retorna todas as etapas cadastradas.
        /// </summary>
        /// <returns>Lista de etapas cadastradas.</returns>
        /// <response code="200">Lista retornada com sucesso.</response>
        /// <response code="204">Nenhuma etapa encontrada.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var etapas = await Etapa.ObterTodosAsync(_dbContext);
            if (etapas == null || !etapas.Any())
                return NoContent();

            var response = etapas.Select(etapa => new EtapaResponse
            {
                Id = etapa.Id,
                Nome = etapa.Nome,
                Descricao = etapa.Descricao,
                Ativo = etapa.Ativo,
                PossuiTarefasAtivas = false
            });

            return Ok(response);
        }

        /// <summary>
        /// Busca uma etapa específica pelo ID.
        /// </summary>
        /// <param name="id">ID da etapa.</param>
        /// <returns>Dados da etapa correspondente.</returns>
        /// <response code="200">Etapa encontrada.</response>
        /// <response code="404">Etapa não encontrada.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var etapa = await Etapa.ObterPorIdAsync(_dbContext, id);
            if (etapa == null)
                return NotFound(new { erro = "Etapa não encontrada." });

            var response = new EtapaResponse
            {
                Id = etapa.Id,
                Nome = etapa.Nome,
                Descricao = etapa.Descricao,
                Ativo = etapa.Ativo,
                PossuiTarefasAtivas = false
            };

            return Ok(response);
        }
    }
}
