using API.DB;
using API.DB.DAOs;
using API.DTOs.Projetos;
using API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ProjetosController : ControllerBase
    {
        private readonly DBContext _dbContext;
        private static readonly ProjetosDAO _projetosDAO = new ProjetosDAO();

        public ProjetosController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] ProjetoCriarRequest request)
        {
            try
            {
                var projeto = new Projeto
                {
                    Titulo = request.Titulo,
                    Descricao = request.Descricao,
                    ClienteId = request.ClienteId,
                    SetorId = request.SetorId,
                    CadastradoPorColaboradorId = ObterColaboradorIdLogado(),
                    Tarefas = request.Tarefas.Select(t => new ProjetoTarefa
                    {
                        Titulo = t.Titulo,
                        Descricao = t.Descricao,
                        PrioridadeId = t.PrioridadeId,
                        ColaboradorResponsavelId = t.ColaboradorResponsavelId,
                        DataHoraAtribuicao = t.DataHoraAtribuicao,
                        EtapaId = t.EtapaId
                    }).ToList()
                };

                var id = await projeto.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterPorId), new { id }, new { id, mensagem = "Projeto criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao criar o projeto.", detalhe = ex.Message });
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
                var projeto = await Projeto.ObterPorIdAsync(_dbContext, id);
                if (projeto == null)
                    return NotFound(new { erro = "Projeto nao encontrado." });

                await projeto.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao inativar o projeto.", detalhe = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Atualizar(int id, [FromBody] ProjetoAtualizarRequest request)
        {
            try
            {
                var projeto = await Projeto.ObterPorIdAsync(_dbContext, id);
                if (projeto == null)
                    return NotFound(new { erro = "Projeto nao encontrado." });

                projeto.Titulo = request.Titulo;
                projeto.Descricao = request.Descricao;
                projeto.ClienteId = request.ClienteId;
                projeto.SetorId = request.SetorId;
                projeto.Tarefas = request.Tarefas.Select(t => new ProjetoTarefa
                {
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    PrioridadeId = t.PrioridadeId,
                    ColaboradorResponsavelId = t.ColaboradorResponsavelId,
                    DataHoraAtribuicao = t.DataHoraAtribuicao,
                    EtapaId = t.EtapaId
                }).ToList();

                await projeto.AtualizarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao atualizar o projeto.", detalhe = ex.Message });
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
                var projeto = await Projeto.ObterPorIdAsync(_dbContext, id);
                if (projeto == null)
                    return NotFound(new { erro = "Projeto nao encontrado." });

                await projeto.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao reativar o projeto.", detalhe = ex.Message });
            }
        }

        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        public async Task<IActionResult> ObterTodos()
        {
            var projetos = await Projeto.ObterTodosAsync(_dbContext);
            if (projetos == null || !projetos.Any())
                return NoContent();

            return Ok(projetos.Select(MapearProjetoResponse));
        }

        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterPorId(int id)
        {
            var projeto = await Projeto.ObterPorIdAsync(_dbContext, id);
            if (projeto == null)
                return NotFound(new { erro = "Projeto nao encontrado." });

            return Ok(MapearProjetoResponse(projeto));
        }

        [HttpGet("kanban")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterKanban(
            [FromQuery] int[] colaboradorIds,
            [FromQuery] int[] projetoIds,
            [FromQuery] int[] clienteIds)
        {
            try
            {
                var tarefas = await _projetosDAO.ObterTarefasKanbanAsync(
                    _dbContext,
                    colaboradorIds: colaboradorIds ?? [],
                    projetoIds: projetoIds ?? [],
                    clienteIds: clienteIds ?? []);

                return Ok(tarefas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter tarefas do kanban.", detalhe = ex.Message });
            }
        }

        [HttpPut("tarefas/{id}/etapa")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MoverEtapa(int id, [FromBody] TarefaMoverEtapaRequest request)
        {
            try
            {
                DateTime? dataAtribuicao = null;
                if (request.ColaboradorResponsavelId.HasValue)
                    dataAtribuicao = DateTime.Now;

                var atualizado = await _projetosDAO.AtualizarEtapaTarefaAsync(
                    _dbContext, id, request.EtapaId, request.ColaboradorResponsavelId, dataAtribuicao);

                if (!atualizado)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao mover tarefa de etapa.", detalhe = ex.Message });
            }
        }

        private int ObterColaboradorIdLogado()
        {
            var claim = User.FindFirstValue("colaboradorId");
            if (!int.TryParse(claim, out var colaboradorId) || colaboradorId <= 0)
                throw new ValidationException("Token invalido para identificar colaborador.");

            return colaboradorId;
        }

        private static ProjetoResponse MapearProjetoResponse(Projeto projeto)
        {
            return new ProjetoResponse
            {
                Id = projeto.Id,
                Titulo = projeto.Titulo,
                Descricao = projeto.Descricao,
                ClienteId = projeto.ClienteId,
                CadastradoPorColaboradorId = projeto.CadastradoPorColaboradorId,
                DataCadastro = projeto.DataCadastro,
                Ativo = projeto.Ativo,
                SetorId = projeto.SetorId,
                Tarefas = projeto.Tarefas.Select(t => new ProjetoTarefaResponse
                {
                    Id = t.Id,
                    ProjetoId = t.ProjetoId,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    PrioridadeId = t.PrioridadeId,
                    ColaboradorResponsavelId = t.ColaboradorResponsavelId,
                    DataHoraAtribuicao = t.DataHoraAtribuicao,
                    EtapaId = t.EtapaId
                }).ToList()
            };
        }
    }
}
