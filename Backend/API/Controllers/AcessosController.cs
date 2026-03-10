using API.DB;
using API.DTOs.NiveisAcesso;
using API.DTOs.Usuarios;
using API.Models;
using API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class AcessosController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public AcessosController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet("permissoes-disponiveis")]
        public async Task<IActionResult> ObterPermissoesDisponiveis()
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            return Ok(new[]
            {
                new { chave = TelaPermissoes.CadastrosCargos, label = "Cadastros - Cargos" },
                new { chave = TelaPermissoes.CadastrosClientes, label = "Cadastros - Clientes" },
                new { chave = TelaPermissoes.CadastrosColaboradores, label = "Cadastros - Colaboradores" },
                new { chave = TelaPermissoes.CadastrosEtapas, label = "Cadastros - Etapas" },
                new { chave = TelaPermissoes.CadastrosPrioridades, label = "Cadastros - Prioridades" },
                new { chave = TelaPermissoes.CadastrosSetores, label = "Cadastros - Setores" },
                new { chave = TelaPermissoes.RelatoriosCargos, label = "Relatorios - Cargos" },
                new { chave = TelaPermissoes.RelatoriosClientes, label = "Relatorios - Clientes" },
                new { chave = TelaPermissoes.RelatoriosColaboradores, label = "Relatorios - Colaboradores" },
                new { chave = TelaPermissoes.RelatoriosEtapas, label = "Relatorios - Etapas" },
                new { chave = TelaPermissoes.RelatoriosPrioridades, label = "Relatorios - Prioridades" },
                new { chave = TelaPermissoes.RelatoriosSetores, label = "Relatorios - Setores" },
                new { chave = TelaPermissoes.RelatoriosAtendimentosHistorico, label = "Relatorios - Historico de Atendimentos" },
                new { chave = TelaPermissoes.AtendimentosAgenda, label = "Atendimento - Agenda" },
                new { chave = TelaPermissoes.ConfiguracoesMinhaConta, label = "Configuracoes - Minha Conta" },
                new { chave = TelaPermissoes.ConfiguracoesAcessos, label = "Configuracoes - Niveis e Usuarios" },
                new { chave = TelaPermissoes.ConfiguracoesSistema, label = "Configuracoes - Parametrizacao do Sistema" }
            });
        }

        [HttpGet("niveis")]
        public async Task<IActionResult> ObterNiveis()
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            var niveis = await NivelAcesso.ObterTodosAsync(_dbContext);
            return Ok(niveis.Select(n => new NivelAcessoResponse
            {
                Id = n.Id,
                Nome = n.Nome,
                Descricao = n.Descricao,
                Ativo = n.Ativo,
                EhAdministrador = n.EhAdministrador,
                Permissoes = n.Permissoes
            }));
        }

        [HttpPost("niveis")]
        public async Task<IActionResult> CriarNivel([FromBody] NivelAcessoCriarRequest request)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                var nivel = new NivelAcesso
                {
                    Nome = request.Nome,
                    Descricao = request.Descricao,
                    EhAdministrador = request.EhAdministrador,
                    Permissoes = request.Permissoes ?? new List<string>()
                };

                var id = await nivel.CriarAsync(_dbContext);
                return CreatedAtAction(nameof(ObterNiveis), new { id }, new { id, mensagem = "Nivel de acesso criado com sucesso." });
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPut("niveis/{id}")]
        public async Task<IActionResult> AtualizarNivel(int id, [FromBody] NivelAcessoAtualizarRequest request)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                var nivel = await NivelAcesso.ObterPorIdAsync(_dbContext, id);
                if (nivel == null)
                    return NotFound(new { erro = "Nivel de acesso nao encontrado." });

                var nomeAnterior = nivel.Nome;
                nivel.Nome = request.Nome;
                nivel.Descricao = request.Descricao;
                nivel.EhAdministrador = request.EhAdministrador;
                nivel.Permissoes = request.Permissoes ?? new List<string>();

                await nivel.AtualizarAsync(_dbContext, nomeAnterior);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpDelete("niveis/{id}")]
        public async Task<IActionResult> InativarNivel(int id)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                var nivel = await NivelAcesso.ObterPorIdAsync(_dbContext, id);
                if (nivel == null)
                    return NotFound(new { erro = "Nivel de acesso nao encontrado." });

                await nivel.InativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPut("niveis/{id}/reativar")]
        public async Task<IActionResult> ReativarNivel(int id)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                var nivel = await NivelAcesso.ObterPorIdAsync(_dbContext, id);
                if (nivel == null)
                    return NotFound(new { erro = "Nivel de acesso nao encontrado." });

                await nivel.ReativarAsync(_dbContext);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpGet("usuarios")]
        public async Task<IActionResult> ObterUsuarios()
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            var usuarios = await Usuario.ObterTodosParaAdministracaoAsync(_dbContext);
            return Ok(usuarios.Select(u => new UsuarioAdminResponse
            {
                Id = u.Id,
                ColaboradorId = u.ColaboradorId,
                ColaboradorNome = u.NomeColaborador,
                Login = u.Login,
                Ativo = u.Ativo,
                NivelAcesso = u.NivelAcesso,
                ColaboradorAtivo = u.ColaboradorAtivo
            }));
        }

        [HttpPut("usuarios/{id}/nivel")]
        public async Task<IActionResult> AtualizarNivelDoUsuario(int id, [FromBody] UsuarioAtualizarNivelRequest request)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                await Usuario.AtualizarNivelAcessoAsync(_dbContext, id, request.NivelAcesso);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPut("usuarios/{id}")]
        public async Task<IActionResult> AtualizarDadosDoUsuario(int id, [FromBody] UsuarioAtualizarDadosAdminRequest request)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                await Usuario.AtualizarDadosAdministrativosAsync(_dbContext, id, request.NovoLogin, request.NovaSenha);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> InativarUsuario(int id)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                await Usuario.InativarAsync(_dbContext, id);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        [HttpPut("usuarios/{id}/reativar")]
        public async Task<IActionResult> ReativarUsuario(int id)
        {
            if (!await TemAcessoAdministrativoAsync())
                return Forbid();

            try
            {
                await Usuario.ReativarAsync(_dbContext, id);
                return NoContent();
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        private async Task<bool> TemAcessoAdministrativoAsync()
        {
            return await AcessoAdminHelper.UsuarioTemPermissaoAsync(User, _dbContext, TelaPermissoes.ConfiguracoesAcessos);
        }
    }
}
