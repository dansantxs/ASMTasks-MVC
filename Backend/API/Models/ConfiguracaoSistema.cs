using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace API.Models
{
    public class ConfiguracaoSistema
    {
        private static readonly ConfiguracoesSistemaDAO _configuracoesSistemaDAO = new ConfiguracoesSistemaDAO();
        private static readonly Regex Base64ImageRegex = new("^data:image\\/[a-zA-Z0-9.+-]+;base64,", RegexOptions.Compiled);

        public int Id { get; set; } = 1;
        public TimeSpan HoraInicioAgenda { get; set; } = new(8, 0, 0);
        public TimeSpan HoraFimAgenda { get; set; } = new(18, 0, 0);
        public string? LogoBase64 { get; set; }
        public string? LogoDocumentosBase64 { get; set; }
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? RazaoSocial { get; set; }
        public string? NomeFantasia { get; set; }
        public string? Cnpj { get; set; }
        public string? InscricaoEstadual { get; set; }
        public string? Cep { get; set; }
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Uf { get; set; }
        public string? SmtpServidor { get; set; }
        public int? SmtpPorta { get; set; }
        public string? SmtpUsuario { get; set; }
        public string? SmtpSenha { get; set; }
        public bool SmtpUsarSslTls { get; set; } = true;

        // Limites de tamanho de anexos
        public int AnexoTamanhoMaximoMB { get; set; } = 20;
        public int? AnexoLimiteImagemMB { get; set; }
        public int? AnexoLimitePdfMB { get; set; }
        public int? AnexoLimiteExcelMB { get; set; }

        public async Task SalvarAsync(DBContext dbContext)
        {
            Normalizar();
            Validar();
            await _configuracoesSistemaDAO.UpsertAsync(dbContext, this);
        }

        public static async Task<ConfiguracaoSistema> ObterAsync(DBContext dbContext)
        {
            return await _configuracoesSistemaDAO.ObterAsync(dbContext);
        }

        private void Normalizar()
        {
            Email = NormalizarTexto(Email);
            Telefone = NormalizarTexto(Telefone);
            RazaoSocial = NormalizarTexto(RazaoSocial);
            NomeFantasia = NormalizarTexto(NomeFantasia);
            Cnpj = NormalizarTexto(Cnpj);
            InscricaoEstadual = NormalizarTexto(InscricaoEstadual);
            Cep = NormalizarTexto(Cep);
            Logradouro = NormalizarTexto(Logradouro);
            Numero = NormalizarTexto(Numero);
            Bairro = NormalizarTexto(Bairro);
            Cidade = NormalizarTexto(Cidade);
            Uf = NormalizarTexto(Uf)?.ToUpperInvariant();
            LogoBase64 = NormalizarTexto(LogoBase64);
            LogoDocumentosBase64 = NormalizarTexto(LogoDocumentosBase64);
            SmtpServidor = NormalizarTexto(SmtpServidor);
            SmtpUsuario = NormalizarTexto(SmtpUsuario);
            SmtpSenha = NormalizarTexto(SmtpSenha);
        }

        private void Validar()
        {
            if (HoraInicioAgenda >= HoraFimAgenda)
                throw new ValidationException("A hora de inicio da agenda deve ser menor que a hora de fim.");

            if (!string.IsNullOrWhiteSpace(Email) && !new EmailAddressAttribute().IsValid(Email))
                throw new ValidationException("Informe um e-mail valido.");

            ValidarConfiguracaoSmtp();
            ValidarLogo(LogoBase64);
            ValidarLogo(LogoDocumentosBase64);
            ValidarLimitesAnexo();
        }

        private void ValidarLimitesAnexo()
        {
            if (AnexoTamanhoMaximoMB <= 0 || AnexoTamanhoMaximoMB > 500)
                throw new ValidationException("O tamanho máximo de anexo deve ser entre 1 e 500 MB.");

            if (AnexoLimiteImagemMB.HasValue && (AnexoLimiteImagemMB.Value <= 0 || AnexoLimiteImagemMB.Value > 500))
                throw new ValidationException("O limite de tamanho para imagens deve ser entre 1 e 500 MB.");

            if (AnexoLimitePdfMB.HasValue && (AnexoLimitePdfMB.Value <= 0 || AnexoLimitePdfMB.Value > 500))
                throw new ValidationException("O limite de tamanho para PDF deve ser entre 1 e 500 MB.");

            if (AnexoLimiteExcelMB.HasValue && (AnexoLimiteExcelMB.Value <= 0 || AnexoLimiteExcelMB.Value > 500))
                throw new ValidationException("O limite de tamanho para Excel deve ser entre 1 e 500 MB.");
        }

        public bool PossuiConfiguracaoEmailCompleta()
        {
            return !string.IsNullOrWhiteSpace(SmtpServidor)
                && SmtpPorta.HasValue
                && SmtpPorta.Value > 0
                && SmtpPorta.Value <= 65535
                && !string.IsNullOrWhiteSpace(SmtpUsuario)
                && !string.IsNullOrWhiteSpace(SmtpSenha);
        }

        private void ValidarConfiguracaoSmtp()
        {
            var existeCampoSmtpPreenchido =
                !string.IsNullOrWhiteSpace(SmtpServidor) ||
                SmtpPorta.HasValue ||
                !string.IsNullOrWhiteSpace(SmtpUsuario) ||
                !string.IsNullOrWhiteSpace(SmtpSenha);

            if (!existeCampoSmtpPreenchido)
            {
                SmtpPorta = null;
                return;
            }

            if (string.IsNullOrWhiteSpace(SmtpServidor))
                throw new ValidationException("Informe o servidor SMTP.");

            if (!SmtpPorta.HasValue || SmtpPorta.Value <= 0 || SmtpPorta.Value > 65535)
                throw new ValidationException("Informe uma porta SMTP valida (1 a 65535).");

            if (string.IsNullOrWhiteSpace(SmtpUsuario))
                throw new ValidationException("Informe o usuario SMTP.");

            if (string.IsNullOrWhiteSpace(SmtpSenha))
                throw new ValidationException("Informe a senha SMTP.");
        }

        private static void ValidarLogo(string? logoBase64)
        {
            if (string.IsNullOrWhiteSpace(logoBase64))
                return;

            if (!Base64ImageRegex.IsMatch(logoBase64))
                throw new ValidationException("A logo deve ser enviada como imagem em base64.");
        }

        private static string? NormalizarTexto(string? valor)
        {
            return string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();
        }
    }
}
