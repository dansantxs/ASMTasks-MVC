using API.DB;
using API.DTOs.Setores;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Controlador responsável por gerenciar os setores e departamentos da organização.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class SetoresController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public SetoresController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria um novo setor.
        /// </summary>
        /// <param name="request">Dados do setor a ser criado.</param>
        /// <returns>ID do setor criado.</returns>
        /// <response code="201">Setor criado com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="500">Erro interno ao criar o setor.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] SetorCriarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var setor = new Setor
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    ResponsavelId = request.ResponsavelId
                };

                var id = await setor.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Setor criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao criar o setor.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Atualiza os dados de um setor existente.
        /// </summary>
        /// <param name="id">ID do setor a ser atualizado.</param>
        /// <param name="request">Dados atualizados do setor.</param>
        /// <response code="204">Setor atualizado com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="404">Setor não encontrado.</response>
        /// <response code="500">Erro interno ao atualizar o setor.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] SetorAtualizarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var setor = await Setor.ObterPorIdAsync(_dbContext, id);
                if (setor == null)
                    return NotFound(new { erro = "Setor não encontrado." });

                setor.Nome = request.Nome;
                setor.Descricao = request.Descricao;
                setor.ResponsavelId = request.ResponsavelId;

                await setor.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao atualizar o setor.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Inativa um setor (soft delete).
        /// </summary>
        /// <param name="id">ID do setor a ser inativado.</param>
        /// <response code="204">Setor inativado com sucesso.</response>
        /// <response code="404">Setor não encontrado.</response>
        /// <response code="500">Erro interno ao inativar o setor.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var setor = await Setor.ObterPorIdAsync(_dbContext, id);
                if (setor == null)
                    return NotFound(new { erro = "Setor não encontrado." });

                await setor.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao inativar o setor.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Reativa um setor previamente inativado.
        /// </summary>
        /// <param name="id">ID do setor a ser reativado.</param>
        /// <response code="204">Setor reativado com sucesso.</response>
        /// <response code="404">Setor não encontrado.</response>
        /// <response code="500">Erro interno ao reativar o setor.</response>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var setor = await Setor.ObterPorIdAsync(_dbContext, id);
                if (setor == null)
                    return NotFound(new { erro = "Setor não encontrado." });

                await setor.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao reativar o setor.", detalhe = ex.Message });
            }
        }

        /// <summary>
        /// Retorna todos os setores cadastrados.
        /// </summary>
        /// <returns>Lista de setores cadastrados.</returns>
        /// <response code="200">Lista retornada com sucesso.</response>
        /// <response code="204">Nenhum setor encontrado.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var setores = await Setor.ObterTodosAsync(_dbContext);
            if (setores == null || !setores.Any())
                return NoContent();

            var response = setores.Select(setor => new SetorResponse
            {
                Id = setor.Id,
                Nome = setor.Nome,
                Descricao = setor.Descricao,
                Ativo = setor.Ativo,
                ResponsavelId = setor.ResponsavelId,
                PossuiFuncionariosAtivos = Setor.VerificarColaboradoresAtivosAsync(_dbContext, setor.Id).Result
            });

            return Ok(response);
        }

        /// <summary>
        /// Busca um setor específico pelo ID.
        /// </summary>
        /// <param name="id">ID do setor.</param>
        /// <returns>Dados do setor correspondente.</returns>
        /// <response code="200">Setor encontrado.</response>
        /// <response code="404">Setor não encontrado.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var setor = await Setor.ObterPorIdAsync(_dbContext, id);
            if (setor == null)
                return NotFound(new { erro = "Setor não encontrado." });

            var response = new SetorResponse
            {
                Id = setor.Id,
                Nome = setor.Nome,
                Descricao = setor.Descricao,
                Ativo = setor.Ativo,
                ResponsavelId = setor.ResponsavelId,
                PossuiFuncionariosAtivos = await Setor.VerificarColaboradoresAtivosAsync(_dbContext, setor.Id)
            };

            return Ok(response);
        }
    }
}