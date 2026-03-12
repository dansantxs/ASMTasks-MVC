using API.DB;
using API.DB.DAOs;
using API.Models;
using System.Net;
using System.Net.Mail;

namespace API.Services
{
    public class AtendimentoNotificacaoProcessor
    {
        private const int LimitePendenciasPorCiclo = 200;

        private readonly DBContext _dbContext;
        private readonly NotificacoesDAO _notificacoesDAO;
        private readonly ILogger<AtendimentoNotificacaoProcessor> _logger;

        public AtendimentoNotificacaoProcessor(
            DBContext dbContext,
            NotificacoesDAO notificacoesDAO,
            ILogger<AtendimentoNotificacaoProcessor> logger)
        {
            _dbContext = dbContext;
            _notificacoesDAO = notificacoesDAO;
            _logger = logger;
        }

        public async Task<int> ProcessarAsync(CancellationToken cancellationToken = default)
        {
            var agora = DateTime.Now;
            var janelaInicio = agora.AddMinutes(-2);
            var janelaFim = agora.AddMinutes(1);

            var pendentes = (await _notificacoesDAO.ObterPendentesParaEnvioAsync(
                _dbContext,
                janelaInicio,
                janelaFim,
                LimitePendenciasPorCiclo)).ToList();

            if (!pendentes.Any())
                return 0;

            var configuracaoSistema = await ConfiguracaoSistema.ObterAsync(_dbContext);
            var podeEnviarEmail = configuracaoSistema.PossuiConfiguracaoEmailCompleta();
            var notificacoesCriadas = 0;

            foreach (var pendente in pendentes)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var notificacao = new NotificacaoSistema
                {
                    ColaboradorId = pendente.ColaboradorId,
                    AtendimentoId = pendente.AtendimentoId,
                    MinutosAntecedencia = pendente.MinutosAntecedencia,
                    Titulo = LimitarTexto(ConstruirTituloSistema(pendente), 180),
                    Mensagem = LimitarTexto(ConstruirMensagemSistema(pendente), 500),
                    DataNotificacao = agora,
                    Lida = false,
                    DataLeitura = null,
                    DataCadastro = agora
                };

                await _notificacoesDAO.InserirNotificacaoSistemaAsync(_dbContext, notificacao);
                notificacoesCriadas++;

                if (!podeEnviarEmail)
                    continue;

                if (string.IsNullOrWhiteSpace(pendente.ColaboradorEmail))
                    continue;

                var emailJaEnviado = await _notificacoesDAO.ExisteEmailEnviadoAsync(
                    _dbContext,
                    pendente.ColaboradorId,
                    pendente.AtendimentoId,
                    pendente.MinutosAntecedencia,
                    pendente.DataNotificacaoPrevista);
                if (emailJaEnviado)
                    continue;

                try
                {
                    await EnviarEmailAsync(configuracaoSistema, pendente);

                    await _notificacoesDAO.RegistrarEmailEnviadoAsync(
                        _dbContext,
                        pendente.ColaboradorId,
                        pendente.AtendimentoId,
                        pendente.MinutosAntecedencia,
                        pendente.ColaboradorEmail,
                        DateTime.Now);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Falha ao enviar e-mail de notificacao. AtendimentoId={AtendimentoId}, ColaboradorId={ColaboradorId}.",
                        pendente.AtendimentoId,
                        pendente.ColaboradorId);
                }
            }

            return notificacoesCriadas;
        }

        private static string ConstruirTituloSistema(NotificacaoPendenteAtendimento pendente)
        {
            return $"Lembrete de atendimento: {pendente.AtendimentoTitulo}";
        }

        private static string ConstruirMensagemSistema(NotificacaoPendenteAtendimento pendente)
        {
            return $"Atendimento '{pendente.AtendimentoTitulo}' com cliente '{pendente.ClienteNome}' em {pendente.DataHoraInicio:dd/MM/yyyy HH:mm}.";
        }

        private static string ConstruirMensagemEmail(NotificacaoPendenteAtendimento pendente)
        {
            return
$@"O atendimento '{pendente.AtendimentoTitulo}' sera iniciado em {FormatarAntecedencia(pendente.MinutosAntecedencia)}.

Cliente: {pendente.ClienteNome}
Data e hora de inicio: {pendente.DataHoraInicio:dd/MM/yyyy HH:mm}";
        }

        private static string FormatarAntecedencia(int minutos)
        {
            if (minutos % 1440 == 0)
                return $"{minutos / 1440} dia(s)";

            if (minutos % 60 == 0)
                return $"{minutos / 60} hora(s)";

            return $"{minutos} minuto(s)";
        }

        private static string LimitarTexto(string valor, int tamanhoMaximo)
        {
            if (string.IsNullOrEmpty(valor))
                return string.Empty;

            if (valor.Length <= tamanhoMaximo)
                return valor;

            return valor.Substring(0, tamanhoMaximo);
        }

        private static async Task EnviarEmailAsync(ConfiguracaoSistema configuracao, NotificacaoPendenteAtendimento pendente)
        {
            using var smtpClient = new SmtpClient(configuracao.SmtpServidor, configuracao.SmtpPorta!.Value)
            {
                EnableSsl = configuracao.SmtpUsarSslTls,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(configuracao.SmtpUsuario, configuracao.SmtpSenha)
            };

            using var message = new MailMessage
            {
                From = new MailAddress(configuracao.SmtpUsuario!),
                Subject = $"Lembrete: atendimento {pendente.AtendimentoTitulo}",
                Body = ConstruirMensagemEmail(pendente),
                IsBodyHtml = false
            };

            message.To.Add(pendente.ColaboradorEmail!);
            await smtpClient.SendMailAsync(message);
        }
    }
}
