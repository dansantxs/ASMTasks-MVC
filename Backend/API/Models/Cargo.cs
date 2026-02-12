using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Cargo
    {
        private static readonly CargosDAO _cargosDAO = new CargosDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; } = true;

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do cargo é obrigatório.");

            if (await _cargosDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome))
                throw new ValidationException("Já existe um cargo com esse nome.");

            Ativo = true;

            return await _cargosDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do cargo é obrigatório.");

            if (await _cargosDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Já existe outro cargo com esse nome.");

            var atualizado = await _cargosDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Cargo não encontrado.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            if (await _cargosDAO.VerificarColaboradoresAtivosAsync(dbContext, Id))
                throw new ValidationException("Não é possível inativar o cargo pois existem colaboradores ativos vinculados a ele.");

            var inativado = await _cargosDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Cargo não encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _cargosDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Cargo não encontrado.");
        }

        public static async Task<IEnumerable<Cargo>> ObterTodosAsync(DBContext dbContext)
        {
            return await _cargosDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Cargo?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _cargosDAO.ObterPorIdAsync(dbContext, id);
        }

        public static async Task<bool> VerificarColaboradoresAtivosAsync(DBContext dbContext, int cargoId)
        {
            return await _cargosDAO.VerificarColaboradoresAtivosAsync(dbContext, cargoId);
        }
    }
}
