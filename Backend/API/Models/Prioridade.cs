using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Prioridade
    {
        private static readonly PrioridadesDAO _prioridadesDAO = new PrioridadesDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public string Cor { get; set; }
        public bool Ativo { get; set; } = true;

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome da prioridade é obrigatório.");

            if (await _prioridadesDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome))
                throw new ValidationException("Já existe uma prioridade com esse nome.");

            Ativo = true;

            return await _prioridadesDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome da prioridade é obrigatório.");

            if (await _prioridadesDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Já existe uma prioridade com esse nome.");

            var atualizado = await _prioridadesDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Prioridade não encontrada.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            // verificar se existem tarefas em andamento

            var inativado = await _prioridadesDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Prioridade não encontrada.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _prioridadesDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Prioridade não encontrada.");
        }

        public static async Task<IEnumerable<Prioridade>> ObterTodosAsync(DBContext dbContext)
        {
            return await _prioridadesDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Prioridade?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _prioridadesDAO.ObterPorIdAsync(dbContext, id);
        }
    }
}