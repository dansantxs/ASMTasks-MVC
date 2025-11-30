using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Setor
    {
        private static readonly SetoresDAO _setoresDAO = new SetoresDAO();
        private static readonly ColaboradoresDAO _colaboradoresDAO = new ColaboradoresDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public bool Ativo { get; set; } = true;
        public int ResponsavelId { get; set; }
        public Colaborador? Responsavel { get; set; }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do setor é obrigatório.");

            if (await _setoresDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome))
                throw new ValidationException("Já existe um setor com esse nome.");

            Responsavel = await _colaboradoresDAO.ObterPorIdAsync(dbContext, ResponsavelId);
            if (Responsavel == null || !Responsavel.Ativo)
                throw new ValidationException("O colaborador responsável informado não existe ou está inativo.");

            Ativo = true;

            return await _setoresDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome do setor é obrigatório.");

            if (await _setoresDAO.VerificarExistenciaPorNomeAsync(dbContext, Nome, Id))
                throw new ValidationException("Já existe outro setor com esse nome.");

            Responsavel = await _colaboradoresDAO.ObterPorIdAsync(dbContext, ResponsavelId);
            if (Responsavel == null || !Responsavel.Ativo)
                throw new ValidationException("O colaborador responsável informado não existe ou está inativo.");

            var atualizado = await _setoresDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Setor não encontrado.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            if (await _setoresDAO.VerificarColaboradoresAtivosAsync(dbContext, Id))
                throw new ValidationException("Não é possível inativar o setor pois existem colaboradores ativos vinculados a ele.");

            // verificar se existem tarefas em andamento

            var inativado = await _setoresDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Setor não encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _setoresDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Setor não encontrado.");
        }

        public static async Task<IEnumerable<Setor>> ObterTodosAsync(DBContext dbContext)
        {
            return await _setoresDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Setor?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _setoresDAO.ObterPorIdAsync(dbContext, id);
        }

        public static async Task<bool> VerificarColaboradoresAtivosAsync(DBContext dbContext, int setorId)
        {
            return await _setoresDAO.VerificarColaboradoresAtivosAsync(dbContext, setorId);
        }
    }
}