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

        private bool ValidarCPF(string cpf)
        {
            cpf = cpf.Replace(".", "").Replace("-", "").Trim();
            
            if (cpf.Length != 11)
                return false;

            if (cpf.Distinct().Count() == 1)
                return false;

            int[] multiplicador1 = new int[9] { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] multiplicador2 = new int[10] { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

            string tempCpf = cpf.Substring(0, 9);
            int soma = 0;

            for (int i = 0; i < 9; i++)
                soma += int.Parse(tempCpf[i].ToString()) * multiplicador1[i];

            int resto = soma % 11;
            resto = resto < 2 ? 0 : 11 - resto;

            string digito = resto.ToString();
            tempCpf += digito;
            soma = 0;

            for (int i = 0; i < 10; i++)
                soma += int.Parse(tempCpf[i].ToString()) * multiplicador2[i];

            resto = soma % 11;
            resto = resto < 2 ? 0 : 11 - resto;

            digito += resto.ToString();

            return cpf.EndsWith(digito);
        }

        private void ValidarDados()
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome é obrigatório.");

            var partesNome = Nome.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (partesNome.Length < 2)
                throw new ValidationException("Digite nome e sobrenome.");

            if (string.IsNullOrWhiteSpace(CPF))
                throw new ValidationException("O CPF é obrigatório.");

            if (!ValidarCPF(CPF))
                throw new ValidationException("O CPF informado é inválido.");

            if (DataNascimento > DateTime.Now)
                throw new ValidationException("A data de nascimento não pode ser futura.");

            var idade = DateTime.Now.Year - DataNascimento.Year;
            if (DataNascimento > DateTime.Now.AddYears(-idade))
                idade--;

            if (idade < 18)
                throw new ValidationException("O colaborador deve ter pelo menos 18 anos.");

            if (DataAdmissao > DateTime.Now)
                throw new ValidationException("A data de admissão não pode ser futura.");
        }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            ValidarDados();

            if (await _colaboradoresDAO.VerificarExistenciaPorCPFAsync(dbContext, CPF))
                throw new ValidationException("Já existe um colaborador com esse CPF.");

            Setor = await _setoresDAO.ObterPorIdAsync(dbContext, SetorId);
            if (Setor == null || !Setor.Ativo)
                throw new ValidationException("O setor informado não existe ou está inativo.");

            Cargo = await _cargosDAO.ObterPorIdAsync(dbContext, CargoId);
            if (Cargo == null || !Cargo.Ativo)
                throw new ValidationException("O cargo informado não existe ou está inativo.");

            Ativo = true;

            return await _colaboradoresDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            ValidarDados();

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