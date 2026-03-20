using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Etapa
    {
        private static readonly EtapasDAO _etapasDAO = new EtapasDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; } = true;
        public int Ordem { get; set; } = 0;

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome da etapa é obrigatório.");

            if (await _etapasDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome))
                throw new ValidationException("Já existe uma etapa com esse nome.");

            Ativo = true;

            return await _etapasDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome da etapa é obrigatório.");

            if (await _etapasDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Já existe outra etapa com esse nome.");

            var atualizado = await _etapasDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Etapa não encontrada.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            if (await _etapasDAO.VerificarTarefasAtivasAsync(dbContext, Id))
                throw new ValidationException("Não é possível inativar a etapa pois existem tarefas ativas de projetos utilizando-a.");

            var inativado = await _etapasDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Etapa não encontrada.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _etapasDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Etapa não encontrada.");
        }

        public static async Task<IEnumerable<Etapa>> ObterTodosAsync(DBContext dbContext)
        {
            return await _etapasDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Etapa?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _etapasDAO.ObterPorIdAsync(dbContext, id);
        }
    }
}