using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class NotificacaoSistema
    {
        private static readonly NotificacoesDAO _notificacoesDAO = new NotificacoesDAO();

        public int Id { get; set; }
        public int ColaboradorId { get; set; }
        public int AtendimentoId { get; set; }
        public int MinutosAntecedencia { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Mensagem { get; set; } = string.Empty;
        public DateTime DataNotificacao { get; set; }
        public bool Lida { get; set; }
        public DateTime? DataLeitura { get; set; }
        public DateTime DataCadastro { get; set; }

        public static async Task<IEnumerable<NotificacaoSistema>> ObterPorColaboradorAsync(
            DBContext dbContext,
            int colaboradorId,
            int limite = 50)
        {
            if (colaboradorId <= 0)
                throw new ValidationException("Colaborador invalido para consulta de notificacoes.");

            var limiteNormalizado = Math.Clamp(limite, 1, 200);
            return await _notificacoesDAO.ObterPorColaboradorAsync(dbContext, colaboradorId, limiteNormalizado);
        }

        public static async Task<int> ObterQuantidadeNaoLidasAsync(DBContext dbContext, int colaboradorId)
        {
            if (colaboradorId <= 0)
                throw new ValidationException("Colaborador invalido para consulta de notificacoes.");

            return await _notificacoesDAO.ObterQuantidadeNaoLidasAsync(dbContext, colaboradorId);
        }

        public static async Task<bool> MarcarComoLidaAsync(DBContext dbContext, int notificacaoId, int colaboradorId)
        {
            if (notificacaoId <= 0)
                throw new ValidationException("Identificador da notificacao invalido.");

            if (colaboradorId <= 0)
                throw new ValidationException("Colaborador invalido para atualizar notificacao.");

            return await _notificacoesDAO.MarcarComoLidaAsync(dbContext, notificacaoId, colaboradorId, DateTime.Now);
        }
    }
}
