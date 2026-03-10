using API.DB;
using API.DB.DAOs;
using NivelAcessoModel = API.Models.NivelAcesso;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace API.Models
{
    public class Usuario
    {
        private static readonly UsuariosDAO _usuariosDAO = new UsuariosDAO();

        public int Id { get; set; }
        public int ColaboradorId { get; set; }
        public string Login { get; set; } = string.Empty;
        public string SenhaHash { get; set; } = string.Empty;
        public bool Ativo { get; set; } = true;
        public string NivelAcesso { get; set; } = "PADRAO";
        public DateTime DataCadastro { get; set; }
        public string NomeColaborador { get; set; } = string.Empty;
        public bool ColaboradorAtivo { get; set; } = true;
        public List<string> Permissoes { get; set; } = new();

        public static async Task<Usuario?> AutenticarAsync(DBContext dbContext, string login, string senha)
        {
            if (string.IsNullOrWhiteSpace(login) || string.IsNullOrWhiteSpace(senha))
                return null;

            await NivelAcessoModel.SincronizarPadroesAsync(dbContext);

            var usuario = await _usuariosDAO.ObterParaLoginAsync(dbContext, login.Trim().ToLowerInvariant());
            if (usuario == null)
            {
                await SincronizarUsuariosAusentesAsync(dbContext);
                usuario = await _usuariosDAO.ObterParaLoginAsync(dbContext, login.Trim().ToLowerInvariant());
            }

            if (usuario == null || !usuario.Ativo)
                return null;

            var senhaHash = GerarHashSenha(senha);
            if (!string.Equals(usuario.SenhaHash, senhaHash, StringComparison.OrdinalIgnoreCase))
                return null;

            usuario.Permissoes = await CarregarPermissoesAsync(dbContext, usuario);
            return usuario;
        }

        public static async Task<Usuario?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            await NivelAcessoModel.SincronizarPadroesAsync(dbContext);
            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, id);
            if (usuario != null)
                usuario.Permissoes = await CarregarPermissoesAsync(dbContext, usuario);
            return usuario;
        }

        public static async Task<Usuario?> ObterPorColaboradorIdAsync(DBContext dbContext, int colaboradorId)
        {
            await NivelAcessoModel.SincronizarPadroesAsync(dbContext);
            var usuario = await _usuariosDAO.ObterPorColaboradorIdAsync(dbContext, colaboradorId);
            if (usuario != null)
                usuario.Permissoes = await CarregarPermissoesAsync(dbContext, usuario);
            return usuario;
        }

        public static async Task CriarAutomaticamenteParaColaboradorAsync(DBContext dbContext, Colaborador colaborador)
        {
            var existente = await ObterPorColaboradorIdAsync(dbContext, colaborador.Id);
            if (existente != null)
                return;

            var loginBase = GerarLoginBase(colaborador.Nome);
            var loginDisponivel = await GerarLoginDisponivelAsync(dbContext, loginBase);
            var senhaInicial = colaborador.DataNascimento.ToString("ddMMyyyy");

            var usuario = new Usuario
            {
                ColaboradorId = colaborador.Id,
                Login = loginDisponivel,
                SenhaHash = GerarHashSenha(senhaInicial),
                Ativo = true,
                NivelAcesso = "PADRAO",
                DataCadastro = DateTime.Now
            };

            await _usuariosDAO.CriarAsync(dbContext, usuario);
        }

        public static async Task SincronizarUsuariosAusentesAsync(DBContext dbContext)
        {
            var colaboradores = await Colaborador.ObterTodosAsync(dbContext);
            foreach (var colaborador in colaboradores)
            {
                await CriarAutomaticamenteParaColaboradorAsync(dbContext, colaborador);
            }
        }

        public static async Task AlterarSenhaAsync(DBContext dbContext, int usuarioId, string senhaAtual, string novaSenha)
        {
            if (string.IsNullOrWhiteSpace(novaSenha) || novaSenha.Length < 6)
                throw new ValidationException("A nova senha deve ter ao menos 6 caracteres.");

            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null || !usuario.Ativo)
                throw new ValidationException("Usuario invalido.");

            var senhaAtualHash = GerarHashSenha(senhaAtual);
            if (!string.Equals(usuario.SenhaHash, senhaAtualHash, StringComparison.OrdinalIgnoreCase))
                throw new ValidationException("Senha atual invalida.");

            var atualizado = await _usuariosDAO.AtualizarSenhaAsync(dbContext, usuarioId, GerarHashSenha(novaSenha));
            if (!atualizado)
                throw new ValidationException("Nao foi possivel alterar a senha.");
        }

        public static async Task AlterarLoginAsync(DBContext dbContext, int usuarioId, string novoLogin)
        {
            if (string.IsNullOrWhiteSpace(novoLogin))
                throw new ValidationException("O login e obrigatorio.");

            var loginNormalizado = novoLogin.Trim().ToLowerInvariant();
            if (loginNormalizado.Length < 4)
                throw new ValidationException("O login deve ter pelo menos 4 caracteres.");

            if (loginNormalizado.Contains(' '))
                throw new ValidationException("O login nao pode conter espacos.");

            if (!Regex.IsMatch(loginNormalizado, "^[a-z0-9._-]+$"))
                throw new ValidationException("Use apenas letras, numeros, ponto, underscore e hifen.");

            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null || !usuario.Ativo)
                throw new ValidationException("Usuario invalido.");

            if (await _usuariosDAO.ExisteLoginAsync(dbContext, loginNormalizado, usuarioId))
                throw new ValidationException("Esse login ja esta em uso.");

            var atualizado = await _usuariosDAO.AtualizarLoginAsync(dbContext, usuarioId, loginNormalizado);
            if (!atualizado)
                throw new ValidationException("Nao foi possivel alterar o login.");
        }

        public static async Task AtualizarDadosAdministrativosAsync(DBContext dbContext, int usuarioId, string novoLogin, string? novaSenha)
        {
            if (string.IsNullOrWhiteSpace(novoLogin))
                throw new ValidationException("O login e obrigatorio.");

            var loginNormalizado = novoLogin.Trim().ToLowerInvariant();
            if (loginNormalizado.Length < 4)
                throw new ValidationException("O login deve ter pelo menos 4 caracteres.");

            if (loginNormalizado.Contains(' '))
                throw new ValidationException("O login nao pode conter espacos.");

            if (!Regex.IsMatch(loginNormalizado, "^[a-z0-9._-]+$"))
                throw new ValidationException("Use apenas letras, numeros, ponto, underscore e hifen.");

            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null)
                throw new ValidationException("Usuario nao encontrado.");

            if (await _usuariosDAO.ExisteLoginAsync(dbContext, loginNormalizado, usuarioId))
                throw new ValidationException("Esse login ja esta em uso.");

            var loginAtualizado = await _usuariosDAO.AtualizarLoginAsync(dbContext, usuarioId, loginNormalizado);
            if (!loginAtualizado)
                throw new ValidationException("Nao foi possivel alterar o login.");

            if (!string.IsNullOrWhiteSpace(novaSenha))
            {
                if (novaSenha.Length < 6)
                    throw new ValidationException("A nova senha deve ter ao menos 6 caracteres.");

                var atualizado = await _usuariosDAO.AtualizarSenhaAsync(dbContext, usuarioId, GerarHashSenha(novaSenha));
                if (!atualizado)
                    throw new ValidationException("Nao foi possivel alterar a senha.");
            }
        }

        public static async Task InativarPorColaboradorIdAsync(DBContext dbContext, int colaboradorId)
        {
            await _usuariosDAO.AtualizarStatusPorColaboradorIdAsync(dbContext, colaboradorId, false);
        }

        public static async Task ReativarPorColaboradorIdAsync(DBContext dbContext, int colaboradorId)
        {
            await _usuariosDAO.AtualizarStatusPorColaboradorIdAsync(dbContext, colaboradorId, true);
        }

        public static async Task<IEnumerable<Usuario>> ObterTodosParaAdministracaoAsync(DBContext dbContext)
        {
            await NivelAcessoModel.SincronizarPadroesAsync(dbContext);
            return await _usuariosDAO.ObterTodosParaAdministracaoAsync(dbContext);
        }

        public static async Task AtualizarNivelAcessoAsync(DBContext dbContext, int usuarioId, string nivelAcesso)
        {
            if (string.IsNullOrWhiteSpace(nivelAcesso))
                throw new ValidationException("O nivel de acesso e obrigatorio.");

            await NivelAcessoModel.SincronizarPadroesAsync(dbContext);

            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null)
                throw new ValidationException("Usuario nao encontrado.");

            var nivel = await NivelAcessoModel.ObterPorNomeAsync(dbContext, nivelAcesso);
            if (nivel == null || !nivel.Ativo)
                throw new ValidationException("Nivel de acesso invalido.");

            var usuarioEhAdministradorAtivo = await _usuariosDAO.UsuarioEhAdministradorAtivoAsync(dbContext, usuarioId);
            if (usuarioEhAdministradorAtivo && !nivel.EhAdministrador)
            {
                var totalAdministradoresAtivos = await _usuariosDAO.ContarUsuariosAdministradoresAtivosAsync(dbContext);
                if (totalAdministradoresAtivos <= 1)
                    throw new ValidationException("Nao e possivel remover o ultimo administrador ativo do sistema.");
            }

            var atualizado = await _usuariosDAO.AtualizarNivelAcessoAsync(dbContext, usuarioId, nivel.Nome);
            if (!atualizado)
                throw new ValidationException("Nao foi possivel atualizar o nivel de acesso.");
        }

        public static async Task InativarAsync(DBContext dbContext, int usuarioId)
        {
            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null)
                throw new ValidationException("Usuario nao encontrado.");

            var usuarioEhAdministradorAtivo = await _usuariosDAO.UsuarioEhAdministradorAtivoAsync(dbContext, usuarioId);
            if (usuarioEhAdministradorAtivo)
            {
                var totalAdministradoresAtivos = await _usuariosDAO.ContarUsuariosAdministradoresAtivosAsync(dbContext);
                if (totalAdministradoresAtivos <= 1)
                    throw new ValidationException("Nao e possivel inativar o ultimo administrador ativo do sistema.");
            }

            var inativado = await _usuariosDAO.InativarPorIdAsync(dbContext, usuarioId);
            if (!inativado)
                throw new ValidationException("Nao foi possivel inativar o usuario.");
        }

        public static async Task ReativarAsync(DBContext dbContext, int usuarioId)
        {
            var usuario = await _usuariosDAO.ObterPorIdAsync(dbContext, usuarioId);
            if (usuario == null)
                throw new ValidationException("Usuario nao encontrado.");

            if (!usuario.ColaboradorAtivo)
                throw new ValidationException("Nao e possivel reativar o usuario de um colaborador inativo.");

            var nivel = await NivelAcessoModel.ObterPorNomeAsync(dbContext, usuario.NivelAcesso);
            if (nivel == null || !nivel.Ativo)
                throw new ValidationException("Nao e possivel reativar o usuario com um nivel de acesso inativo.");

            var reativado = await _usuariosDAO.ReativarPorIdAsync(dbContext, usuarioId);
            if (!reativado)
                throw new ValidationException("Nao foi possivel reativar o usuario.");
        }

        public static string GerarHashSenha(string senha)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(senha));
            return Convert.ToHexString(bytes);
        }

        private static string GerarLoginBase(string nome)
        {
            var primeiroNome = nome.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault() ?? "usuario";
            var semAcentos = RemoverAcentos(primeiroNome).ToLowerInvariant();
            var apenasAlfanumerico = Regex.Replace(semAcentos, "[^a-z0-9]", "");
            return string.IsNullOrWhiteSpace(apenasAlfanumerico) ? "usuario" : apenasAlfanumerico;
        }

        private static string RemoverAcentos(string texto)
        {
            var normalized = texto.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder();
            foreach (var c in normalized)
            {
                if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
                    builder.Append(c);
            }
            return builder.ToString().Normalize(NormalizationForm.FormC);
        }

        private static async Task<string> GerarLoginDisponivelAsync(DBContext dbContext, string loginBase)
        {
            var login = loginBase;
            var sufixo = 1;
            while (await _usuariosDAO.ExisteLoginAsync(dbContext, login))
            {
                login = $"{loginBase}{sufixo}";
                sufixo++;
            }
            return login;
        }

        private static async Task<List<string>> CarregarPermissoesAsync(DBContext dbContext, Usuario usuario)
        {
            var permissoes = await NivelAcessoModel.ObterPermissoesPorNomeAsync(dbContext, usuario.NivelAcesso);

            if (!await _usuariosDAO.ExisteUsuarioAdministradorAsync(dbContext) &&
                !permissoes.Contains(API.Security.TelaPermissoes.ConfiguracoesAcessos))
            {
                permissoes.Add(API.Security.TelaPermissoes.ConfiguracoesAcessos);
            }

            return permissoes
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(p => p, StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
