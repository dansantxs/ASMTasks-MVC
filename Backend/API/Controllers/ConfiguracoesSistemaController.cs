using API.DB;
using API.DTOs.ConfiguracoesSistema;
using API.Models;
using API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Globalization;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class ConfiguracoesSistemaController : ControllerBase
    {
        private readonly DBContext _dbContext;

        public ConfiguracoesSistemaController(DBContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> Obter()
        {
            var configuracao = await ConfiguracaoSistema.ObterAsync(_dbContext);
            return Ok(Mapear(configuracao));
        }

        [HttpPut]
        public async Task<IActionResult> Salvar([FromBody] ConfiguracaoSistemaRequest request)
        {
            if (!await ConfiguracaoSistemaHelper.UsuarioPodeEditarAsync(User, _dbContext))
                return Forbid();

            try
            {
                var configuracao = new ConfiguracaoSistema
                {
                    HoraInicioAgenda = ParseHora(request.HoraInicioAgenda, "inicio"),
                    HoraFimAgenda = ParseHora(request.HoraFimAgenda, "fim"),
                    LogoBase64 = request.LogoBase64,
                    LogoDocumentosBase64 = request.LogoDocumentosBase64,
                    Email = request.Email,
                    Telefone = request.Telefone,
                    RazaoSocial = request.RazaoSocial,
                    NomeFantasia = request.NomeFantasia,
                    Cnpj = request.Cnpj,
                    InscricaoEstadual = request.InscricaoEstadual,
                    Cep = request.Cep,
                    Logradouro = request.Logradouro,
                    Numero = request.Numero,
                    Bairro = request.Bairro,
                    Cidade = request.Cidade,
                    Uf = request.Uf,
                    SmtpServidor = request.SmtpServidor,
                    SmtpPorta = request.SmtpPorta,
                    SmtpUsuario = request.SmtpUsuario,
                    SmtpSenha = request.SmtpSenha,
                    SmtpUsarSslTls = request.SmtpUsarSslTls,
                    AnexoTamanhoMaximoMB = request.AnexoTamanhoMaximoMB > 0 ? request.AnexoTamanhoMaximoMB : 20,
                    AnexoLimiteImagemMB = request.AnexoLimiteImagemMB,
                    AnexoLimitePdfMB = request.AnexoLimitePdfMB,
                    AnexoLimiteExcelMB = request.AnexoLimiteExcelMB
                };

                await configuracao.SalvarAsync(_dbContext);
                return Ok(Mapear(configuracao));
            }
            catch (ValidationException ex)
            {
                return BadRequest(new { erro = ex.Message });
            }
        }

        private static TimeSpan ParseHora(string? valor, string campo)
        {
            if (string.IsNullOrWhiteSpace(valor))
                throw new ValidationException($"Informe a hora de {campo} da agenda.");

            if (!TimeSpan.TryParseExact(valor, @"hh\:mm", CultureInfo.InvariantCulture, out var hora))
                throw new ValidationException($"A hora de {campo} da agenda deve estar no formato HH:mm.");

            return hora;
        }

        private static ConfiguracaoSistemaResponse Mapear(ConfiguracaoSistema configuracao)
        {
            return new ConfiguracaoSistemaResponse
            {
                HoraInicioAgenda = configuracao.HoraInicioAgenda.ToString(@"hh\:mm"),
                HoraFimAgenda = configuracao.HoraFimAgenda.ToString(@"hh\:mm"),
                LogoBase64 = configuracao.LogoBase64,
                LogoDocumentosBase64 = configuracao.LogoDocumentosBase64,
                Email = configuracao.Email,
                Telefone = configuracao.Telefone,
                RazaoSocial = configuracao.RazaoSocial,
                NomeFantasia = configuracao.NomeFantasia,
                Cnpj = configuracao.Cnpj,
                InscricaoEstadual = configuracao.InscricaoEstadual,
                Cep = configuracao.Cep,
                Logradouro = configuracao.Logradouro,
                Numero = configuracao.Numero,
                Bairro = configuracao.Bairro,
                Cidade = configuracao.Cidade,
                Uf = configuracao.Uf,
                SmtpServidor = configuracao.SmtpServidor,
                SmtpPorta = configuracao.SmtpPorta,
                SmtpUsuario = configuracao.SmtpUsuario,
                SmtpSenha = configuracao.SmtpSenha,
                SmtpUsarSslTls = configuracao.SmtpUsarSslTls,
                AnexoTamanhoMaximoMB = configuracao.AnexoTamanhoMaximoMB,
                AnexoLimiteImagemMB = configuracao.AnexoLimiteImagemMB,
                AnexoLimitePdfMB = configuracao.AnexoLimitePdfMB,
                AnexoLimiteExcelMB = configuracao.AnexoLimiteExcelMB
            };
        }
    }
}
