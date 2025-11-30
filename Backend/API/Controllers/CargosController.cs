using API.DB;
using API.DTOs.Cargos;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Controlador responsável por gerenciar os cargos da organização.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class CargosController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public CargosController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria um novo cargo.
        /// </summary>
        /// <param name="request">Dados do cargo a ser criado.</param>
        /// <returns>ID do cargo criado.</returns>
        /// <response code="201">Cargo criado com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="500">Erro interno ao criar o cargo.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] CargoCriarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var cargo = new Cargo
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao
                };

                var id = await cargo.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Cargo criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao criar o cargo.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza os dados de um cargo existente.
        /// </summary>
        /// <param name="id">ID do cargo a ser atualizado.</param>
        /// <param name="request">Dados atualizados do cargo.</param>
        /// <response code="204">Cargo atualizado com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="404">Cargo não encontrado.</response>
        /// <response code="500">Erro interno ao atualizar o cargo.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] CargoAtualizarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var cargo = await Cargo.ObterPorIdAsync(_dbContext, id);
                if (cargo == null)
                    return NotFound(new { erro = "Cargo não encontrado." });

                cargo.Nome = request.Nome;
                cargo.Descricao = request.Descricao;

                await cargo.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao atualizar o cargo.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Inativa um cargo.
        /// </summary>
        /// <param name="id">ID do cargo a ser inativado.</param>
        /// <response code="204">Cargo inativado com sucesso.</response>
        /// <response code="404">Cargo não encontrado.</response>
        /// <response code="500">Erro interno ao inativar o cargo.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var cargo = await Cargo.ObterPorIdAsync(_dbContext, id);
                if (cargo == null)
                    return NotFound(new { erro = "Cargo não encontrado." });

                await cargo.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao inativar o cargo.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Reativa um cargo previamente inativado.
        /// </summary>
        /// <param name="id">ID do cargo a ser reativado.</param>
        /// <response code="204">Cargo reativado com sucesso.</response>
        /// <response code="404">Cargo não encontrado.</response>
        /// <response code="500">Erro interno ao reativar o cargo.</response>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var cargo = await Cargo.ObterPorIdAsync(_dbContext, id);
                if (cargo == null)
                    return NotFound(new { erro = "Cargo não encontrado." });

                await cargo.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao reativar o cargo.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Retorna todos os cargos cadastrados.
        /// </summary>
        /// <returns>Lista de cargos cadastrados.</returns>
        /// <response code="200">Lista retornada com sucesso.</response>
        /// <response code="204">Nenhum cargo encontrado.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var cargos = await Cargo.ObterTodosAsync(_dbContext);
            if (cargos == null || !cargos.Any())
                return NoContent();

            var response = cargos.Select(cargo => new CargoResponse
            {
                Id = cargo.Id,
                Nome = cargo.Nome,
                Descricao = cargo.Descricao,
                Ativo = cargo.Ativo
            });

            return Ok(response);
        }

        /// <summary>
        /// Busca um cargo específico pelo ID.
        /// </summary>
        /// <param name="id">ID do cargo.</param>
        /// <returns>Dados do cargo correspondente.</returns>
        /// <response code="200">Cargo encontrado.</response>
        /// <response code="404">Cargo não encontrado.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var cargo = await Cargo.ObterPorIdAsync(_dbContext, id);
            if (cargo == null)
                return NotFound(new { erro = "Cargo não encontrado." });

            var response = new CargoResponse
            {
                Id = cargo.Id,
                Nome = cargo.Nome,
                Descricao = cargo.Descricao,
                Ativo = cargo.Ativo
            };

            return Ok(response);
        }
    }
}