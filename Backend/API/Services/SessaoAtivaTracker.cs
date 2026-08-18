using System.Collections.Concurrent;

namespace API.Services
{
    // Rastreia em memoria a expiracao do token mais recente de cada usuario logado,
    // para permitir a pausa automatica de tarefas quando a sessao expira sem logout explicito.
    public class SessaoAtivaTracker
    {
        private readonly ConcurrentDictionary<int, DateTime> _expiracoesUtcPorUsuario = new();

        public void RegistrarSessao(int usuarioId, DateTime expiraEmUtc)
        {
            _expiracoesUtcPorUsuario[usuarioId] = expiraEmUtc;
        }

        public void RemoverSessao(int usuarioId)
        {
            _expiracoesUtcPorUsuario.TryRemove(usuarioId, out _);
        }

        public List<int> ExtrairSessoesExpiradas(DateTime agoraUtc)
        {
            var expiradas = new List<int>();
            foreach (var (usuarioId, expiraEmUtc) in _expiracoesUtcPorUsuario)
            {
                if (expiraEmUtc > agoraUtc)
                    continue;

                if (_expiracoesUtcPorUsuario.TryRemove(usuarioId, out _))
                    expiradas.Add(usuarioId);
            }
            return expiradas;
        }
    }
}
