namespace API.DTOs.ConfiguracoesSistema
{
    public class ConfiguracaoSistemaRequest
    {
        public string? HoraInicioAgenda { get; set; }
        public string? HoraFimAgenda { get; set; }
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
        public int AnexoTamanhoMaximoMB { get; set; } = 20;
        public int? AnexoLimiteImagemMB { get; set; }
        public int? AnexoLimitePdfMB { get; set; }
        public int? AnexoLimiteExcelMB { get; set; }
    }
}
