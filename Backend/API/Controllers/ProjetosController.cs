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
            if (!request.Tarefas.Any())
                return BadRequest(new { erro = "O projeto deve ter ao menos uma tarefa." });

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
            if (!request.Tarefas.Any())
                return BadRequest(new { erro = "O projeto deve ter ao menos uma tarefa." });

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
                    Id = t.Id ?? 0,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    PrioridadeId = t.PrioridadeId,
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

        [HttpPut("{id}/desmarcar-conclusao")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DesmarcarConclusao(int id)
        {
            try
            {
                var projeto = await Projeto.ObterPorIdAsync(_dbContext, id);
                if (projeto == null)
                    return NotFound(new { erro = "Projeto nao encontrado." });

                await _projetosDAO.DesmarcarConclusaoProjetoAsync(_dbContext, id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao desmarcar conclusão do projeto.", detalhe = ex.Message });
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
                var ehAdmClaim = User.FindFirstValue("ehAdministrador");
                var ehAdministrador = string.Equals(ehAdmClaim, "true", StringComparison.OrdinalIgnoreCase);

                var tarefas = await _projetosDAO.ObterTarefasKanbanAsync(
                    _dbContext,
                    colaboradorIds: colaboradorIds ?? [],
                    projetoIds: projetoIds ?? [],
                    clienteIds: clienteIds ?? [],
                    incluirBacklog: true);

                return Ok(tarefas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter tarefas do kanban.", detalhe = ex.Message });
            }
        }

        [HttpPut("tarefas/{id}/etapa")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MoverEtapa(int id, [FromBody] TarefaMoverEtapaRequest request)
        {
            try
            {
                var ehAdmClaim = User.FindFirstValue("ehAdministrador");
                var ehAdministrador = string.Equals(ehAdmClaim, "true", StringComparison.OrdinalIgnoreCase);

                var estadoAtual = await _projetosDAO.ObterEstadoAtualTarefaAsync(_dbContext, id);
                if (estadoAtual == null)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                if (!ehAdministrador)
                {
                    if (estadoAtual.ColaboradorResponsavelId.HasValue)
                    {
                        var colaboradorLogado = ObterColaboradorIdLogado();
                        if (estadoAtual.ColaboradorResponsavelId.Value != colaboradorLogado)
                            return StatusCode(StatusCodes.Status403Forbidden,
                                new { erro = "Apenas o responsável ou um administrador pode mover esta tarefa." });
                    }
                }

                DateTime? dataAtribuicao = null;
                if (request.ColaboradorResponsavelId.HasValue)
                    dataAtribuicao = DateTime.Now;

                var atualizado = await _projetosDAO.AtualizarEtapaTarefaAsync(
                    _dbContext, id, request.EtapaId, request.ColaboradorResponsavelId, dataAtribuicao);

                if (!atualizado)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                var agora = DateTime.Now;

                if (request.EtapaId != estadoAtual.EtapaId)
                {
                    await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                    {
                        TarefaId = id,
                        Tipo = 'E',
                        EtapaId = request.EtapaId,
                        DataHoraAcao = agora
                    });
                }

                if (request.ColaboradorResponsavelId != estadoAtual.ColaboradorResponsavelId)
                {
                    await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                    {
                        TarefaId = id,
                        Tipo = 'A',
                        ColaboradorId = request.ColaboradorResponsavelId,
                        DataHoraAcao = agora
                    });
                }

                if (request.EtapaId != estadoAtual.EtapaId)
                    await _projetosDAO.AtualizarStatusConclusaoProjetoAsync(_dbContext, id);

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao mover tarefa de etapa.", detalhe = ex.Message });
            }
        }

        [HttpPut("tarefas/{id}/colaborador")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> TrocarColaborador(int id, [FromBody] TarefaTrocarColaboradorRequest request)
        {
            try
            {
                var ehAdmClaim = User.FindFirstValue("ehAdministrador");
                var ehAdministrador = string.Equals(ehAdmClaim, "true", StringComparison.OrdinalIgnoreCase);

                var estadoAtual = await _projetosDAO.ObterEstadoAtualTarefaAsync(_dbContext, id);
                if (estadoAtual == null)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                if (!ehAdministrador)
                {
                    if (estadoAtual.ColaboradorResponsavelId.HasValue)
                    {
                        var colaboradorLogado = ObterColaboradorIdLogado();
                        if (estadoAtual.ColaboradorResponsavelId.Value != colaboradorLogado)
                            return StatusCode(StatusCodes.Status403Forbidden,
                                new { erro = "Apenas o responsável ou um administrador pode alterar o responsável desta tarefa." });
                    }
                }

                if (request.ColaboradorResponsavelId == estadoAtual.ColaboradorResponsavelId)
                    return NoContent();

                DateTime? dataAtribuicao = request.ColaboradorResponsavelId.HasValue ? DateTime.Now : null;

                var atualizado = await _projetosDAO.AtualizarColaboradorTarefaAsync(
                    _dbContext, id, request.ColaboradorResponsavelId, dataAtribuicao);

                if (!atualizado)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                {
                    TarefaId = id,
                    Tipo = 'A',
                    ColaboradorId = request.ColaboradorResponsavelId,
                    DataHoraAcao = DateTime.Now
                });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao trocar responsável.", detalhe = ex.Message });
            }
        }

        [HttpPost("tarefas/{id}/iniciar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> IniciarTarefa(int id)
        {
            try
            {
                var estadoAtual = await _projetosDAO.ObterEstadoAtualTarefaAsync(_dbContext, id);
                if (estadoAtual == null)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                if (!estadoAtual.EtapaId.HasValue)
                    return BadRequest(new { erro = "Não é possível iniciar uma tarefa que está no backlog." });

                if (!estadoAtual.ColaboradorResponsavelId.HasValue)
                    return BadRequest(new { erro = "Não é possível iniciar uma tarefa sem responsável." });

                if (estadoAtual.DataHoraInicio.HasValue)
                    return BadRequest(new { erro = "Esta tarefa já foi iniciada." });

                var ehAdmClaim = User.FindFirstValue("ehAdministrador");
                var ehAdministrador = string.Equals(ehAdmClaim, "true", StringComparison.OrdinalIgnoreCase);
                var colaboradorLogado = ObterColaboradorIdLogado();

                if (!ehAdministrador && estadoAtual.ColaboradorResponsavelId.Value != colaboradorLogado)
                    return StatusCode(StatusCodes.Status403Forbidden,
                        new { erro = "Apenas o responsável ou um administrador pode iniciar esta tarefa." });

                var iniciado = await _projetosDAO.IniciarTarefaAsync(_dbContext, id, colaboradorLogado, DateTime.Now);
                if (!iniciado)
                    return BadRequest(new { erro = "Não foi possível iniciar a tarefa. Ela pode já ter sido iniciada." });

                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao iniciar tarefa.", detalhe = ex.Message });
            }
        }

        [HttpPost("tarefas/{id}/pausar")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> PausarTarefa(int id, [FromBody] TarefaPausarRequest? request)
        {
            try
            {
                var estadoAtual = await _projetosDAO.ObterEstadoAtualTarefaAsync(_dbContext, id);
                if (estadoAtual == null)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                if (!estadoAtual.DataHoraInicio.HasValue)
                    return BadRequest(new { erro = "Esta tarefa não está em andamento." });

                var ehAdmClaim = User.FindFirstValue("ehAdministrador");
                var ehAdministrador = string.Equals(ehAdmClaim, "true", StringComparison.OrdinalIgnoreCase);
                var colaboradorLogado = ObterColaboradorIdLogado();

                if (!ehAdministrador && estadoAtual.ColaboradorResponsavelId.Value != colaboradorLogado)
                    return StatusCode(StatusCodes.Status403Forbidden,
                        new { erro = "Apenas o responsável ou um administrador pode pausar esta tarefa." });

                var pausado = await _projetosDAO.PausarTarefaAsync(_dbContext, id, colaboradorLogado, DateTime.Now, request?.Observacao);
                if (!pausado)
                    return BadRequest(new { erro = "Não foi possível pausar a tarefa. Ela pode não estar em andamento." });

                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao pausar tarefa.", detalhe = ex.Message });
            }
        }

        [HttpGet("tarefas/{id}/historico")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> ObterHistoricoTarefa(int id)
        {
            try
            {
                var historico = await _projetosDAO.ObterHistoricoTarefaAsync(_dbContext, id);
                return Ok(historico);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter histórico da tarefa.", detalhe = ex.Message });
            }
        }

        [HttpGet("tarefas/relatorio-historico")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterRelatorioHistorico(
            [FromQuery] string? tipo,
            [FromQuery] int? colaboradorId,
            [FromQuery] int? projetoId,
            [FromQuery] int? clienteId,
            [FromQuery] DateTime? dataInicio,
            [FromQuery] DateTime? dataFim)
        {
            try
            {
                char? tipoChar = null;
                if (!string.IsNullOrEmpty(tipo) && tipo.Length == 1)
                    tipoChar = tipo[0];

                var resultado = await _projetosDAO.ObterRelatorioHistoricoAsync(
                    _dbContext,
                    tipoChar,
                    colaboradorId,
                    projetoId,
                    clienteId,
                    dataInicio,
                    dataFim);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter relatório de histórico.", detalhe = ex.Message });
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
                Concluido = projeto.Concluido,
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
