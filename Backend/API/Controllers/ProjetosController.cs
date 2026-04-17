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
    public class ProjetosController(DBContext dbContext, IWebHostEnvironment env) : ControllerBase
    {
        private readonly DBContext _dbContext = dbContext;
        private readonly IWebHostEnvironment _env = env;
        private static readonly ProjetosDAO _projetosDAO = new();

        private static readonly string[] _tiposArquivoPermitidos =
            ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

        private const long _tamanhoMaximoBytes = 20 * 1024 * 1024; // 20 MB

        private string ObterPastaAnexos()
        {
            var pasta = Path.Combine(_env.ContentRootPath, "uploads", "tarefas");
            Directory.CreateDirectory(pasta);
            return pasta;
        }

        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Criar([FromBody] ProjetoCriarRequest request)
        {
            if (request.Tarefas.Count == 0)
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
                    Tarefas = [.. request.Tarefas.Select(t => new ProjetoTarefa
                    {
                        Titulo = t.Titulo,
                        Descricao = t.Descricao,
                        PrioridadeId = t.PrioridadeId,
                        ColaboradorResponsavelId = t.ColaboradorResponsavelId,
                        DataHoraAtribuicao = t.DataHoraAtribuicao,
                        EtapaId = t.EtapaId
                    })]
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
            if (request.Tarefas.Count == 0)
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
                projeto.Tarefas = [.. request.Tarefas.Select(t => new ProjetoTarefa
                {
                    Id = t.Id ?? 0,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    PrioridadeId = t.PrioridadeId,
                })];

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

                var colaboradorLogado = ObterColaboradorIdLogado();
                await _projetosDAO.InserirHistoricoProjetoAsync(_dbContext, new ProjetoHistorico
                {
                    ProjetoId = id,
                    Tipo = 'R',
                    RealizadoPorColaboradorId = colaboradorLogado,
                    DataHoraAcao = DateTime.Now
                });

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

        [HttpPost("{id}/duplicar")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> Duplicar(int id, [FromBody] ProjetoDuplicarRequest request)
        {
            if (request.ClienteIds == null || request.ClienteIds.Count == 0)
                return BadRequest(new { erro = "Selecione ao menos um cliente." });

            try
            {
                var original = await Projeto.ObterPorIdAsync(_dbContext, id);
                if (original == null)
                    return NotFound(new { erro = "Projeto nao encontrado." });

                var colaboradorId = ObterColaboradorIdLogado();
                var idsGerados = new List<int>();

                foreach (var clienteId in request.ClienteIds)
                {
                    var copia = new Projeto
                    {
                        Titulo = original.Titulo,
                        Descricao = original.Descricao,
                        ClienteId = clienteId,
                        SetorId = original.SetorId,
                        CadastradoPorColaboradorId = colaboradorId,
                        Tarefas = [.. original.Tarefas.Select(t => new ProjetoTarefa
                        {
                            Titulo = t.Titulo,
                            Descricao = t.Descricao,
                            PrioridadeId = t.PrioridadeId,
                            ColaboradorResponsavelId = null,
                            DataHoraAtribuicao = null,
                            EtapaId = null,
                            DataHoraInicio = null
                        })]
                    };

                    var novoId = await copia.CriarAsync(_dbContext);
                    idsGerados.Add(novoId);
                }

                return Ok(new { ids = idsGerados, mensagem = $"{idsGerados.Count} projeto(s) duplicado(s) com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao duplicar o projeto.", detalhe = ex.Message });
            }
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

                var colaboradorLogado = ObterColaboradorIdLogado();

                if (!ehAdministrador)
                {
                    if (estadoAtual.ColaboradorResponsavelId.HasValue)
                    {
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
                    if (estadoAtual.DataHoraInicio.HasValue)
                    {
                        await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                        {
                            TarefaId = id,
                            Tipo = 'F',
                            DataHoraAcao = agora,
                            RealizadoPorColaboradorId = colaboradorLogado
                        });
                    }

                    await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                    {
                        TarefaId = id,
                        Tipo = 'E',
                        EtapaId = request.EtapaId,
                        DataHoraAcao = agora,
                        RealizadoPorColaboradorId = colaboradorLogado
                    });
                }

                if (request.ColaboradorResponsavelId != estadoAtual.ColaboradorResponsavelId)
                {
                    if (estadoAtual.DataHoraInicio.HasValue && request.EtapaId == estadoAtual.EtapaId)
                    {
                        await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                        {
                            TarefaId = id,
                            Tipo = 'P',
                            Observacao = "Troca de colaborador",
                            DataHoraAcao = agora,
                            RealizadoPorColaboradorId = colaboradorLogado
                        });
                    }

                    await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                    {
                        TarefaId = id,
                        Tipo = 'A',
                        ColaboradorId = request.ColaboradorResponsavelId,
                        DataHoraAcao = agora,
                        RealizadoPorColaboradorId = colaboradorLogado
                    });
                }

                if (request.EtapaId != estadoAtual.EtapaId)
                {
                    var projetoConcluido = await _projetosDAO.AtualizarStatusConclusaoProjetoAsync(_dbContext, id);
                    if (projetoConcluido)
                    {
                        await _projetosDAO.InserirHistoricoProjetoAsync(_dbContext, new ProjetoHistorico
                        {
                            ProjetoId = estadoAtual.ProjetoId,
                            Tipo = 'C',
                            RealizadoPorColaboradorId = colaboradorLogado,
                            DataHoraAcao = agora
                        });
                    }
                }

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

                var colaboradorLogado = ObterColaboradorIdLogado();

                if (!ehAdministrador)
                {
                    if (estadoAtual.ColaboradorResponsavelId.HasValue)
                    {
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

                var agora = DateTime.Now;

                if (estadoAtual.DataHoraInicio.HasValue)
                {
                    await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                    {
                        TarefaId = id,
                        Tipo = 'P',
                        Observacao = "Troca de colaborador",
                        DataHoraAcao = agora,
                        RealizadoPorColaboradorId = colaboradorLogado
                    });
                }

                await _projetosDAO.InserirHistoricoAsync(_dbContext, new ProjetoTarefaHistorico
                {
                    TarefaId = id,
                    Tipo = 'A',
                    ColaboradorId = request.ColaboradorResponsavelId,
                    DataHoraAcao = agora,
                    RealizadoPorColaboradorId = colaboradorLogado
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

                if (!ehAdministrador && estadoAtual.ColaboradorResponsavelId.GetValueOrDefault() != colaboradorLogado)
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

        [HttpGet("historico-relatorio")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterRelatorioHistoricoProjeto(
            [FromQuery] string? tipo,
            [FromQuery] int? projetoId,
            [FromQuery] int? clienteId,
            [FromQuery] int? colaboradorId,
            [FromQuery] DateTime? dataInicio,
            [FromQuery] DateTime? dataFim)
        {
            try
            {
                char? tipoChar = null;
                if (!string.IsNullOrEmpty(tipo) && tipo.Length == 1)
                    tipoChar = tipo[0];

                var resultado = await _projetosDAO.ObterRelatorioHistoricoProjetoAsync(
                    _dbContext,
                    tipoChar,
                    projetoId,
                    clienteId,
                    colaboradorId,
                    dataInicio,
                    dataFim);

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter relatório de histórico de projetos.", detalhe = ex.Message });
            }
        }

        [HttpGet("{id}/historico")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> ObterHistoricoProjeto(int id)
        {
            try
            {
                var historico = await _projetosDAO.ObterHistoricoProjetoAsync(_dbContext, id);
                return Ok(historico);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter histórico do projeto.", detalhe = ex.Message });
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

        [HttpPost("tarefas/{id}/anexos")]
        [RequestSizeLimit(20 * 1024 * 1024)]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> UploadAnexo(int id, IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { erro = "Nenhum arquivo enviado." });

            if (arquivo.Length > _tamanhoMaximoBytes)
                return BadRequest(new { erro = "O arquivo excede o tamanho máximo de 20 MB." });

            if (!_tiposArquivoPermitidos.Contains(arquivo.ContentType.ToLower()))
                return BadRequest(new { erro = "Tipo de arquivo não permitido. São aceitos: JPEG, PNG, GIF, WebP e PDF." });

            try
            {
                var existe = await _projetosDAO.TarefaExisteAsync(_dbContext, id);
                if (!existe)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                var extensao = Path.GetExtension(arquivo.FileName);
                var nomeArquivo = $"{Guid.NewGuid()}{extensao}";
                var caminho = Path.Combine(ObterPastaAnexos(), nomeArquivo);

                await using (var stream = System.IO.File.Create(caminho))
                    await arquivo.CopyToAsync(stream);

                var anexo = new ProjetoTarefaAnexo
                {
                    TarefaId = id,
                    NomeOriginal = arquivo.FileName,
                    NomeArquivo = nomeArquivo,
                    ContentType = arquivo.ContentType,
                    Tamanho = arquivo.Length,
                    DataUpload = DateTime.Now,
                    EnviadoPorColaboradorId = ObterColaboradorIdLogado()
                };

                var novoId = await _projetosDAO.InserirAnexoAsync(_dbContext, anexo);
                anexo.Id = novoId;

                return StatusCode(StatusCodes.Status201Created, new
                {
                    id = novoId,
                    tarefaId = id,
                    nomeOriginal = anexo.NomeOriginal,
                    contentType = anexo.ContentType,
                    tamanho = anexo.Tamanho,
                    dataUpload = anexo.DataUpload
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao fazer upload do anexo.", detalhe = ex.Message });
            }
        }

        [HttpGet("tarefas/{id}/anexos")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ObterAnexos(int id)
        {
            try
            {
                var existe = await _projetosDAO.TarefaExisteAsync(_dbContext, id);
                if (!existe)
                    return NotFound(new { erro = "Tarefa não encontrada." });

                var anexos = await _projetosDAO.ObterAnexosTarefaAsync(_dbContext, id);
                return Ok(anexos.Select(a => new
                {
                    id = a.Id,
                    tarefaId = a.TarefaId,
                    nomeOriginal = a.NomeOriginal,
                    contentType = a.ContentType,
                    tamanho = a.Tamanho,
                    dataUpload = a.DataUpload
                }));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter anexos.", detalhe = ex.Message });
            }
        }

        [HttpGet("tarefas/anexos/{anexoId}/arquivo")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> ObterArquivoAnexo(int anexoId)
        {
            try
            {
                var anexo = await _projetosDAO.ObterAnexoPorIdAsync(_dbContext, anexoId);
                if (anexo == null)
                    return NotFound(new { erro = "Anexo não encontrado." });

                var caminho = Path.Combine(ObterPastaAnexos(), anexo.NomeArquivo);
                if (!System.IO.File.Exists(caminho))
                    return NotFound(new { erro = "Arquivo não encontrado no servidor." });

                var bytes = await System.IO.File.ReadAllBytesAsync(caminho);
                return File(bytes, anexo.ContentType, anexo.NomeOriginal);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao obter arquivo.", detalhe = ex.Message });
            }
        }

        [HttpDelete("tarefas/anexos/{anexoId}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> DeletarAnexo(int anexoId)
        {
            try
            {
                var anexo = await _projetosDAO.ObterAnexoPorIdAsync(_dbContext, anexoId);
                if (anexo == null)
                    return NotFound(new { erro = "Anexo não encontrado." });

                var deletado = await _projetosDAO.DeletarAnexoAsync(_dbContext, anexoId);
                if (!deletado)
                    return NotFound(new { erro = "Anexo não encontrado." });

                var caminho = Path.Combine(ObterPastaAnexos(), anexo.NomeArquivo);
                if (System.IO.File.Exists(caminho))
                    System.IO.File.Delete(caminho);

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { erro = "Erro ao deletar anexo.", detalhe = ex.Message });
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
                Tarefas = [.. projeto.Tarefas.Select(t => new ProjetoTarefaResponse
                {
                    Id = t.Id,
                    ProjetoId = t.ProjetoId,
                    Titulo = t.Titulo,
                    Descricao = t.Descricao,
                    PrioridadeId = t.PrioridadeId,
                    ColaboradorResponsavelId = t.ColaboradorResponsavelId,
                    DataHoraAtribuicao = t.DataHoraAtribuicao,
                    EtapaId = t.EtapaId
                })]
            };
        }
    }
}
