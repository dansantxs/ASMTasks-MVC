using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Colaborador
    {
        private static readonly ColaboradoresDAO _colaboradoresDAO = new ColaboradoresDAO();
        private readonly SetoresDAO _setoresDAO = new SetoresDAO();
        private readonly CargosDAO _cargosDAO = new CargosDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string CPF { get; set; } = string.Empty;
        public string? Email { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string? CEP { get; set; }
        public string? Cidade { get; set; }
        public string? UF { get; set; }
        public string? Logradouro { get; set; }
        public string? Bairro { get; set; }
        public int? Numero { get; set; }
        public DateTime DataNascimento { get; set; }
        public DateTime DataAdmissao { get; set; }
        public bool Ativo { get; set; } = true;
        public int SetorId { get; set; }
        public Setor? Setor { get; set; }
        public int CargoId { get; set; }
        public Cargo? Cargo { get; set; }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome é obrigatório.");

            if (string.IsNullOrWhiteSpace(CPF))
                throw new ValidationException("O CPF é obrigatório.");

            if (await _colaboradoresDAO.VerificarExistenciaPorCPFAsync(dbContext, CPF))
                throw new ValidationException("Já existe um colaborador com esse CPF.");

            Setor = await _setoresDAO.ObterPorIdAsync(dbContext, SetorId);
            if (Setor == null || !Setor.Ativo)
                throw new ValidationException("O setor informado não existe ou está inativo.");

            Cargo = await _cargosDAO.ObterPorIdAsync(dbContext, CargoId);
            if (Cargo == null || !Cargo.Ativo)
                throw new ValidationException("O cargo informado não existe ou está inativo.");

            Ativo = true;
            DataAdmissao = DateTime.UtcNow;

            return await _colaboradoresDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome é obrigatório.");

            if (string.IsNullOrWhiteSpace(CPF))
                throw new ValidationException("O CPF é obrigatório.");

            if (await _colaboradoresDAO.VerificarExistenciaPorCPFAsync(dbContext, CPF, Id))
                throw new ValidationException("Já existe outro colaborador com esse CPF.");

            Setor = await _setoresDAO.ObterPorIdAsync(dbContext, SetorId);
            if (Setor == null || !Setor.Ativo)
                throw new ValidationException("O setor informado não existe ou está inativo.");

            Cargo = await _cargosDAO.ObterPorIdAsync(dbContext, CargoId);
            if (Cargo == null || !Cargo.Ativo)
                throw new ValidationException("O cargo informado não existe ou está inativo.");

            var atualizado = await _colaboradoresDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Colaborador não encontrado.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            if (await _colaboradoresDAO.VerificarResponsavelSetorAsync(dbContext, Id))
                throw new ValidationException("Não é possível inativar o colaborador pois ele é responsável por um setor ativo.");

            // verificar se existem tarefas em andamento

            var inativado = await _colaboradoresDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Colaborador não encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _colaboradoresDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Colaborador não encontrado.");
        }

        public static async Task<IEnumerable<Colaborador>> ObterTodosAsync(DBContext dbContext)
        {
            return await _colaboradoresDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Colaborador?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _colaboradoresDAO.ObterPorIdAsync(dbContext, id);
        }

        public static async Task<bool> VerificarResponsavelSetorAsync(DBContext dbContext, int colaboradorId)
        {
            return await _colaboradoresDAO.VerificarResponsavelSetorAsync(dbContext, colaboradorId);
        }
    }
}