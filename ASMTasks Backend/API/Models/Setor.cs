using API.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Setor
    {
        private static readonly SetoresDAO _setoresDAO = new SetoresDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
        public bool Ativo { get; set; } = true;
        public int? ResponsavelId { get; set; }
        public Colaborador? Responsavel { get; set; }

        public async Task<int> CriarAsync(DbContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do setor é obrigatório.");

            if (await _setoresDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome))
                throw new ValidationException("Já existe um setor com esse nome.");

            CriadoEm = DateTime.UtcNow;
            Ativo = true;

            return await _setoresDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DbContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do setor é obrigatório.");

            if (await _setoresDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Já existe outro setor com esse nome.");

            var atualizado = await _setoresDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Setor não encontrado.");
        }

        public async Task InativarAsync(DbContext dbContext)
        {
            // verificar se existem tarefas em andamento

            var inativado = await _setoresDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Setor não encontrado.");
        }

        public async Task ReativarAsync(DbContext dbContext)
        {
            var reativado = await _setoresDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Setor não encontrado.");
        }

        public static async Task<IEnumerable<Setor>> ObterTodosAsync(DbContext dbContext)
        {
            return await _setoresDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Setor?> ObterPorIdAsync(DbContext dbContext, int id)
        {
            return await _setoresDAO.ObterPorIdAsync(dbContext, id);
        }
    }
}