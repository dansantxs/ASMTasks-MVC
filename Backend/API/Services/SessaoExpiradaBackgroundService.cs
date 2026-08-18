namespace API.Services
{
    public class SessaoExpiradaBackgroundService : BackgroundService
    {
        private static readonly TimeSpan IntervaloExecucao = TimeSpan.FromSeconds(60);

        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SessaoExpiradaBackgroundService> _logger;

        public SessaoExpiradaBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<SessaoExpiradaBackgroundService> logger)
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
                    var processor = scope.ServiceProvider.GetRequiredService<SessaoExpiradaProcessor>();
                    var tarefasPausadas = await processor.ProcessarAsync(stoppingToken);

                    if (tarefasPausadas > 0)
                    {
                        _logger.LogInformation(
                            "Processamento de sessoes expiradas pausou {Quantidade} tarefa(s) automaticamente.",
                            tarefasPausadas);
                    }
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro durante processamento periodico de sessoes expiradas.");
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
