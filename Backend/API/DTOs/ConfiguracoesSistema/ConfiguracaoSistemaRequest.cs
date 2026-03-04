namespace API.DTOs.ConfiguracoesSistema
{
    public class ConfiguracaoSistemaRequest
    {
        public string? HoraInicioAgenda { get; set; }
        public string? HoraFimAgenda { get; set; }
        public string? LogoBase64 { get; set; }
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
    }
}
