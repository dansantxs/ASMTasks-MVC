namespace API.DTOs.Notificacoes
{
    public class NotificacaoSistemaListaResponse
    {
        public int QuantidadeNaoLidas { get; set; }
        public List<NotificacaoSistemaResponse> Itens { get; set; } = new List<NotificacaoSistemaResponse>();
    }
}
