using API.DB;
using API.DB.DAOs;

namespace API.Services
{
    // Quando a sessao de um usuario expira sem logout explicito, pausa automaticamente
    // qualquer tarefa que ele tenha deixado em andamento (ex.: saiu para o almoco e esqueceu de pausar).
    public class SessaoExpiradaProcessor
    {
        private const string ObservacaoPausaAutomatica = "Pausada automaticamente: sessão expirada.";

        private readonly DBContext _dbContext;
        private readonly SessaoAtivaTracker _tracker;
        private readonly UsuariosDAO _usuariosDAO;
        private readonly ProjetosDAO _projetosDAO;
        private readonly ILogger<SessaoExpiradaProcessor> _logger;

        public SessaoExpiradaProcessor(
            DBContext dbContext,
            SessaoAtivaTracker tracker,
            UsuariosDAO usuariosDAO,
            ProjetosDAO projetosDAO,
            ILogger<SessaoExpiradaProcessor> logger)
        {
            _dbContext = dbContext;
            _tracker = tracker;
            _usuariosDAO = usuariosDAO;
            _projetosDAO = projetosDAO;
            _logger = logger;
        }

        public async Task<int> ProcessarAsync(CancellationToken cancellationToken)
        {
            var usuariosExpirados = _tracker.ExtrairSessoesExpiradas(DateTime.UtcNow);
            var tarefasPausadas = 0;

            foreach (var usuarioId in usuariosExpirados)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var usuario = await _usuariosDAO.ObterPorIdAsync(_dbContext, usuarioId);
                if (usuario == null)
                    continue;

                var tarefasEmAndamento = await _projetosDAO.ObterTarefasEmAndamentoPorColaboradorAsync(_dbContext, usuario.ColaboradorId);
                foreach (var tarefaId in tarefasEmAndamento)
                {
                    var pausada = await _projetosDAO.PausarTarefaAsync(
                        _dbContext, tarefaId, usuario.ColaboradorId, DateTime.Now, ObservacaoPausaAutomatica);

                    if (pausada)
                    {
                        tarefasPausadas++;
                        _logger.LogInformation(
                            "Tarefa {TarefaId} pausada automaticamente por expiracao de sessao do usuario {UsuarioId}.",
                            tarefaId, usuarioId);
                    }
                }
            }

            return tarefasPausadas;
        }
    }
}
