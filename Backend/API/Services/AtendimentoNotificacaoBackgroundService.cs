namespace API.Services
{
    public class AtendimentoNotificacaoBackgroundService : BackgroundService
    {
        private static readonly TimeSpan IntervaloExecucao = TimeSpan.FromSeconds(30);

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AtendimentoNotificacaoBackgroundService> _logger;

        public AtendimentoNotificacaoBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<AtendimentoNotificacaoBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var processor = scope.ServiceProvider.GetRequiredService<AtendimentoNotificacaoProcessor>();
                    var notificacoesCriadas = await processor.ProcessarAsync(stoppingToken);

                    if (notificacoesCriadas > 0)
                    {
                        _logger.LogInformation(
                            "Processamento de notificacoes concluiu com {Quantidade} notificacoes novas.",
                            notificacoesCriadas);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro durante processamento periodico de notificacoes.");
                }

                try
                {
                    await Task.Delay(IntervaloExecucao, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }
    }
}
