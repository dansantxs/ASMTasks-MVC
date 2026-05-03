using System.ComponentModel.DataAnnotations;

namespace API.DTOs.ConfiguracoesSistema
{
    public class ConfiguracaoSistemaRequest
    {
        [StringLength(5)]
        public string? HoraInicioAgenda { get; set; }

        [StringLength(5)]
        public string? HoraFimAgenda { get; set; }

        public string? LogoBase64 { get; set; }
        public string? LogoDocumentosBase64 { get; set; }

        [EmailAddress]
        [StringLength(200)]
        public string? Email { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }

        [StringLength(200)]
        public string? RazaoSocial { get; set; }

        [StringLength(200)]
        public string? NomeFantasia { get; set; }

        [StringLength(18)]
        public string? Cnpj { get; set; }

        [StringLength(30)]
        public string? InscricaoEstadual { get; set; }

        [StringLength(9)]
        public string? Cep { get; set; }

        [StringLength(200)]
        public string? Logradouro { get; set; }

        [StringLength(10)]
        public string? Numero { get; set; }

        [StringLength(100)]
        public string? Bairro { get; set; }

        [StringLength(100)]
        public string? Cidade { get; set; }

        [StringLength(2)]
        public string? Uf { get; set; }

        [StringLength(200)]
        public string? SmtpServidor { get; set; }

        [Range(1, 65535)]
        public int? SmtpPorta { get; set; }

        [StringLength(200)]
        public string? SmtpUsuario { get; set; }

        [StringLength(255)]
        public string? SmtpSenha { get; set; }

        public bool SmtpUsarSslTls { get; set; } = true;

        [Range(1, 500)]
        public int AnexoTamanhoMaximoMB { get; set; } = 20;

        [Range(1, 500)]
        public int? AnexoLimiteImagemMB { get; set; }

        [Range(1, 500)]
        public int? AnexoLimitePdfMB { get; set; }

        [Range(1, 500)]
        public int? AnexoLimiteExcelMB { get; set; }
    }
}
