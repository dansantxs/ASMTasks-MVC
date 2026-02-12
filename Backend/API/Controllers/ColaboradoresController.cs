using API.DB;
using API.DTOs.Colaboradores;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    /// <summary>
    /// Controlador responsável por gerenciar os colaboradores da organização.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ColaboradoresController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public ColaboradoresController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        /// <summary>
        /// Cria um novo colaborador.
        /// </summary>
        /// <param name="request">Dados do colaborador a ser criado.</param>
        /// <returns>ID do colaborador criado.</returns>
        /// <response code="201">Colaborador criado com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="500">Erro interno ao criar o colaborador.</response>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] ColaboradorCriarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var colaborador = new Colaborador
                {
                    Nome = request.Nome,
                    CPF = request.CPF,
                    Email = request.Email,
                    Telefone = request.Telefone,
                    CEP = request.CEP,
                    Cidade = request.Cidade,
                    UF = request.UF,
                    Logradouro = request.Logradouro,
                    Bairro = request.Bairro,
                    Numero = request.Numero,
                    DataNascimento = request.DataNascimento,
                    DataAdmissao = request.DataAdmissao,
                    SetorId = request.SetorId,
                    CargoId = request.CargoId
                };

                var id = await colaborador.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Colaborador criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao criar o colaborador." });
            }
        }

        /// <summary>
        /// Atualiza os dados de um colaborador existente.
        /// </summary>
        /// <param name="id">ID do colaborador a ser atualizado.</param>
        /// <param name="request">Dados atualizados do colaborador.</param>
        /// <response code="204">Colaborador atualizado com sucesso.</response>
        /// <response code="400">Erro de validação nos dados enviados.</response>
        /// <response code="404">Colaborador não encontrado.</response>
        /// <response code="500">Erro interno ao atualizar o colaborador.</response>
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] ColaboradorAtualizarRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var colaborador = await Colaborador.ObterPorIdAsync(_dbContext, id);
                if (colaborador == null)
                    return NotFound(new { erro = "Colaborador não encontrado." });

                colaborador.Nome = request.Nome;
                colaborador.CPF = request.CPF;
                colaborador.Email = request.Email;
                colaborador.Telefone = request.Telefone;
                colaborador.CEP = request.CEP;
                colaborador.Cidade = request.Cidade;
                colaborador.UF = request.UF;
                colaborador.Logradouro = request.Logradouro;
                colaborador.Bairro = request.Bairro;
                colaborador.Numero = request.Numero;
                colaborador.DataNascimento = request.DataNascimento;
                colaborador.DataAdmissao = request.DataAdmissao;
                colaborador.SetorId = request.SetorId;
                colaborador.CargoId = request.CargoId;

                await colaborador.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao atualizar o colaborador." });
            }
        }

        /// <summary>
        /// Inativa um colaborador.
        /// </summary>
        /// <param name="id">ID do colaborador a ser inativado.</param>
        /// <response code="204">Colaborador inativado com sucesso.</response>
        /// <response code="404">Colaborador não encontrado.</response>
        /// <response code="500">Erro interno ao inativar o colaborador.</response>
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var colaborador = await Colaborador.ObterPorIdAsync(_dbContext, id);
                if (colaborador == null)
                    return NotFound(new { erro = "Colaborador não encontrado." });

                await colaborador.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao inativar o colaborador." });
            }
        }

        /// <summary>
        /// Reativa um colaborador previamente inativado.
        /// </summary>
        /// <param name="id">ID do colaborador a ser reativado.</param>
        /// <response code="204">Colaborador reativado com sucesso.</response>
        /// <response code="404">Colaborador não encontrado.</response>
        /// <response code="500">Erro interno ao reativar o colaborador.</response>
        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var colaborador = await Colaborador.ObterPorIdAsync(_dbContext, id);
                if (colaborador == null)
                    return NotFound(new { erro = "Colaborador não encontrado." });

                await colaborador.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Ocorreu um erro ao reativar o colaborador." });
            }
        }

        /// <summary>
        /// Retorna todos os colaboradores cadastrados.
        /// </summary>
        /// <returns>Lista de colaboradores cadastrados.</returns>
        /// <response code="200">Lista retornada com sucesso.</response>
        /// <response code="204">Nenhum colaborador encontrado.</response>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var colaboradores = await Colaborador.ObterTodosAsync(_dbContext);
            if (colaboradores == null || !colaboradores.Any())
                return NoContent();

            var response = colaboradores.Select(c => new ColaboradorResponse
            {
                Id = c.Id,
                Nome = c.Nome,
                CPF = c.CPF,
                Email = c.Email,
                Telefone = c.Telefone,
                CEP = c.CEP,
                Cidade = c.Cidade,
                UF = c.UF,
                Logradouro = c.Logradouro,
                Bairro = c.Bairro,
                Numero = c.Numero,
                DataNascimento = c.DataNascimento,
                DataAdmissao = c.DataAdmissao,
                Ativo = c.Ativo,
                SetorId = c.SetorId,
                CargoId = c.CargoId,
                PossuiTarefasAtivas = false
            });

            return Ok(response);
        }

        /// <summary>
        /// Busca um colaborador específico pelo ID.
        /// </summary>
        /// <param name="id">ID do colaborador.</param>
        /// <returns>Dados do colaborador correspondente.</returns>
        /// <response code="200">Colaborador encontrado.</response>
        /// <response code="404">Colaborador não encontrado.</response>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var colaborador = await Colaborador.ObterPorIdAsync(_dbContext, id);
            if (colaborador == null)
                return NotFound(new { erro = "Colaborador não encontrado." });

            var response = new ColaboradorResponse
            {
                Id = colaborador.Id,
                Nome = colaborador.Nome,
                CPF = colaborador.CPF,
                Email = colaborador.Email,
                Telefone = colaborador.Telefone,
                CEP = colaborador.CEP,
                Cidade = colaborador.Cidade,
                UF = colaborador.UF,
                Logradouro = colaborador.Logradouro,
                Bairro = colaborador.Bairro,
                Numero = colaborador.Numero,
                DataNascimento = colaborador.DataNascimento,
                DataAdmissao = colaborador.DataAdmissao,
                Ativo = colaborador.Ativo,
                SetorId = colaborador.SetorId,
                CargoId = colaborador.CargoId,
                PossuiTarefasAtivas = false
            };

            return Ok(response);
        }
    }
}
