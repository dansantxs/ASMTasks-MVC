using API.DB;
using API.DTOs.Clientes;
using API.Models;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class ClientesController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public ClientesController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] ClienteCriarRequest request)
        {
            try
            {
                var cliente = new Cliente
                {
                    Nome = request.Nome,
                    Documento = request.Documento,
                    TipoPessoa = request.TipoPessoa,
                    RG = request.RG,
                    InscricaoEstadual = request.InscricaoEstadual,
                    Email = request.Email,
                    Telefone = request.Telefone,
                    CEP = request.CEP,
                    Cidade = request.Cidade,
                    UF = request.UF,
                    Logradouro = request.Logradouro,
                    Bairro = request.Bairro,
                    Numero = request.Numero,
                    Site = request.Site,
                    DataReferencia = request.DataReferencia
                };

                var id = await cliente.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Cliente criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Erro ao criar o cliente." });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] ClienteAtualizarRequest request)
        {
            try
            {
                var cliente = await Cliente.ObterPorIdAsync(_dbContext, id);
                if (cliente == null)
                    return NotFound(new { erro = "Cliente não encontrado." });

                cliente.Nome = request.Nome;
                cliente.Documento = request.Documento;
                cliente.TipoPessoa = request.TipoPessoa;
                cliente.RG = request.RG;
                cliente.InscricaoEstadual = request.InscricaoEstadual;
                cliente.Email = request.Email;
                cliente.Telefone = request.Telefone;
                cliente.CEP = request.CEP;
                cliente.Cidade = request.Cidade;
                cliente.UF = request.UF;
                cliente.Logradouro = request.Logradouro;
                cliente.Bairro = request.Bairro;
                cliente.Numero = request.Numero;
                cliente.Site = request.Site;
                cliente.DataReferencia = request.DataReferencia;

                await cliente.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Erro ao atualizar o cliente." });
            }
        }

        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Inativar(int id)
        {
            try
            {
                var cliente = await Cliente.ObterPorIdAsync(_dbContext, id);
                if (cliente == null)
                    return NotFound(new { erro = "Cliente não encontrado." });

                await cliente.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Erro ao inativar o cliente." });
            }
        }

        [HttpPut("{id}/reativar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Reativar(int id)
        {
            try
            {
                var cliente = await Cliente.ObterPorIdAsync(_dbContext, id);
                if (cliente == null)
                    return NotFound(new { erro = "Cliente não encontrado." });

                await cliente.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, new { erro = "Erro ao reativar o cliente." });
            }
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var clientes = await Cliente.ObterTodosAsync(_dbContext);
            if (clientes == null || !clientes.Any())
                return NoContent();

            var response = clientes.Select(c => new ClienteResponse
            {
                Id = c.Id,
                Nome = c.Nome,
                Documento = c.Documento,
                TipoPessoa = c.TipoPessoa,
                RG = c.RG,
                InscricaoEstadual = c.InscricaoEstadual,
                Email = c.Email,
                Telefone = c.Telefone,
                CEP = c.CEP,
                Cidade = c.Cidade,
                UF = c.UF,
                Logradouro = c.Logradouro,
                Bairro = c.Bairro,
                Numero = c.Numero,
                Site = c.Site,
                DataReferencia = c.DataReferencia,
                Ativo = c.Ativo,
                PossuiTarefasAtivas = false
            });

            return Ok(response);
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var c = await Cliente.ObterPorIdAsync(_dbContext, id);
            if (c == null)
                return NotFound(new { erro = "Cliente não encontrado." });

            var response = new ClienteResponse
            {
                Id = c.Id,
                Nome = c.Nome,
                Documento = c.Documento,
                TipoPessoa = c.TipoPessoa,
                RG = c.RG,
                InscricaoEstadual = c.InscricaoEstadual,
                Email = c.Email,
                Telefone = c.Telefone,
                CEP = c.CEP,
                Cidade = c.Cidade,
                UF = c.UF,
                Logradouro = c.Logradouro,
                Bairro = c.Bairro,
                Numero = c.Numero,
                Site = c.Site,
                DataReferencia = c.DataReferencia,
                Ativo = c.Ativo,
                PossuiTarefasAtivas = false
            };

            return Ok(response);
        }
    }
}
