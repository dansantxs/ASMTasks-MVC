namespace API.DTOs.Notificacoes
{
    public class NotificacaoSistemaResponse
    {
        public int Id { get; set; }
        public int AtendimentoId { get; set; }
        public int MinutosAntecedencia { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Mensagem { get; set; } = string.Empty;
        public DateTime DataNotificacao { get; set; }
        public bool Lida { get; set; }
        public DateTime? DataLeitura { get; set; }
        public DateTime DataCadastro { get; set; }
    }
}
