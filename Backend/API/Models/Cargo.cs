using API.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Cargo
    {
        private static readonly CargosDAO _cargosDAO = new CargosDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
        public bool Ativo { get; set; } = true;

        public async Task<int> CriarAsync(DbContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do cargo é obrigatório.");

            if (await _cargosDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome))
                throw new ValidationException("Já existe um cargo com esse nome.");

            CriadoEm = DateTime.UtcNow;
            Ativo = true;

            return await _cargosDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DbContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do cargo é obrigatório.");

            if (await _cargosDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Já existe outro cargo com esse nome.");

            var atualizado = await _cargosDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Cargo não encontrado.");
        }

        public async Task InativarAsync(DbContext dbContext)
        {
            var inativado = await _cargosDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Cargo não encontrado.");
        }

        public async Task ReativarAsync(DbContext dbContext)
        {
            var reativado = await _cargosDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Cargo não encontrado.");
        }

        public static async Task<IEnumerable<Cargo>> ObterTodosAsync(DbContext dbContext)
        {
            return await _cargosDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Cargo?> ObterPorIdAsync(DbContext dbContext, int id)
        {
            return await _cargosDAO.ObterPorIdAsync(dbContext, id);
        }
    }
}