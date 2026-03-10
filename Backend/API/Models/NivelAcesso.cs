using API.DB;
using API.DB.DAOs;
using API.Security;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class NivelAcesso
    {
        private static readonly NiveisAcessoDAO _niveisAcessoDAO = new NiveisAcessoDAO();
        private static readonly UsuariosDAO _usuariosDAO = new UsuariosDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; } = true;
        public bool EhAdministrador { get; set; }
        public List<string> Permissoes { get; set; } = new();

        private void Validar()
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do nivel de acesso e obrigatorio.");

            Nome = Nome.Trim().ToUpperInvariant();

            if (Nome.Length < 3)
                throw new ValidationException("O nome do nivel de acesso deve ter pelo menos 3 caracteres.");

            if (Permissoes.Count == 0)
                throw new ValidationException("Selecione ao menos uma permissao para o nivel de acesso.");

            var invalidas = Permissoes
                .Where(p => !TelaPermissoes.Todas.Contains(p))
                .Distinct()
                .ToList();

            if (invalidas.Count > 0)
                throw new ValidationException("Existem permissoes invalidas no nivel de acesso.");

            Permissoes = Permissoes
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            Validar();

            if (await _niveisAcessoDAO.ExisteNomeAsync(dbContext, Nome))
                throw new ValidationException("Ja existe um nivel de acesso com esse nome.");

            Ativo = true;
            return await _niveisAcessoDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext, string nomeAnterior)
        {
            Validar();

            if (await _niveisAcessoDAO.ExisteNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Ja existe outro nivel de acesso com esse nome.");

            var nivelAtual = await _niveisAcessoDAO.ObterPorIdAsync(dbContext, Id);
            if (nivelAtual == null)
                throw new ValidationException("Nivel de acesso nao encontrado.");

            if (nivelAtual.EhAdministrador && !EhAdministrador)
            {
                var totalAdministradoresAtivos = await _usuariosDAO.ContarUsuariosAdministradoresAtivosAsync(dbContext);
                var administradoresAtivosDoNivel = await _usuariosDAO.ContarUsuariosAdministradoresAtivosPorNivelAsync(dbContext, nivelAtual.Nome);
                if (totalAdministradoresAtivos - administradoresAtivosDoNivel <= 0)
                    throw new ValidationException("Nao e possivel remover o ultimo administrador ativo do sistema.");
            }

            var atualizado = await _niveisAcessoDAO.AtualizarAsync(dbContext, this, nomeAnterior);
            if (!atualizado)
                throw new ValidationException("Nivel de acesso nao encontrado.");

            if (!string.Equals(nomeAnterior, Nome, StringComparison.OrdinalIgnoreCase))
                await _usuariosDAO.AtualizarNivelAcessoPorNomeAsync(dbContext, nomeAnterior, Nome);
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            var possuiUsuarios = await _usuariosDAO.ExisteUsuarioComNivelAcessoAsync(dbContext, Nome);
            if (possuiUsuarios)
                throw new ValidationException("Nao e possivel inativar um nivel vinculado a usuarios.");

            var inativado = await _niveisAcessoDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Nivel de acesso nao encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _niveisAcessoDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Nivel de acesso nao encontrado.");
        }

        public static async Task<IEnumerable<NivelAcesso>> ObterTodosAsync(DBContext dbContext)
        {
            return await _niveisAcessoDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<NivelAcesso?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _niveisAcessoDAO.ObterPorIdAsync(dbContext, id);
        }

        public static async Task<NivelAcesso?> ObterPorNomeAsync(DBContext dbContext, string nome)
        {
            return await _niveisAcessoDAO.ObterPorNomeAsync(dbContext, nome);
        }

        public static async Task<List<string>> ObterPermissoesPorNomeAsync(DBContext dbContext, string nome)
        {
            var nivel = await _niveisAcessoDAO.ObterPorNomeAsync(dbContext, nome);
            return nivel?.Permissoes ?? new List<string>();
        }

        public static async Task SincronizarPadroesAsync(DBContext dbContext)
        {
            if (!await _niveisAcessoDAO.ExisteNomeAsync(dbContext, "ADMINISTRADOR"))
            {
                await new NivelAcesso
                {
                    Nome = "ADMINISTRADOR",
                    Descricao = "Acesso total ao sistema e a tela administrativa de acessos.",
                    EhAdministrador = true,
                    Permissoes = TelaPermissoes.Todas.ToList()
                }.CriarAsync(dbContext);
            }

            if (!await _niveisAcessoDAO.ExisteNomeAsync(dbContext, "PADRAO"))
            {
                await new NivelAcesso
                {
                    Nome = "PADRAO",
                    Descricao = "Nivel padrao inicial do sistema.",
                    EhAdministrador = false,
                    Permissoes = TelaPermissoes.Padrao.ToList()
                }.CriarAsync(dbContext);
            }
        }
    }
}
