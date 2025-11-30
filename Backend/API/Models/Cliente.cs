using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using System.Linq;

namespace API.Models
{
    public class Cliente
    {
        private static readonly ClientesDAO _clientesDAO = new ClientesDAO();

        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Documento { get; set; } = string.Empty;   
        public char TipoPessoa { get; set; }
        public string? RG { get; set; }                         
        public string? InscricaoEstadual { get; set; }          
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? CEP { get; set; }
        public string? Cidade { get; set; }
        public string? UF { get; set; }
        public string? Logradouro { get; set; }
        public string? Bairro { get; set; }
        public int? Numero { get; set; }
        public string? Site { get; set; }
        public DateTime? DataReferencia { get; set; }
        public bool Ativo { get; set; } = true;

        private bool ValidarCPF(string cpf)
        {
            cpf = Regex.Replace(cpf ?? string.Empty, "[^0-9]", "");
            if (cpf.Length != 11 || cpf.Distinct().Count() == 1) return false;

            int[] m1 = { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] m2 = { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };

            string temp = cpf[..9];
            int soma = 0;
            for (int i = 0; i < 9; i++)
                soma += int.Parse(temp[i].ToString()) * m1[i];

            int resto = soma % 11;
            resto = resto < 2 ? 0 : 11 - resto;
            string digito = resto.ToString();
            temp += digito;
            soma = 0;

            for (int i = 0; i < 10; i++)
                soma += int.Parse(temp[i].ToString()) * m2[i];

            resto = soma % 11;
            resto = resto < 2 ? 0 : 11 - resto;
            digito += resto.ToString();

            return cpf.EndsWith(digito);
        }

        private bool ValidarCNPJ(string cnpj)
        {
            cnpj = Regex.Replace(cnpj ?? string.Empty, "[^0-9]", "");
            if (cnpj.Length != 14 || new string(cnpj[0], 14) == cnpj) return false;

            int[] m1 = { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
            int[] m2 = { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

            string temp = cnpj[..12];
            int soma = 0;
            for (int i = 0; i < 12; i++)
                soma += int.Parse(temp[i].ToString()) * m1[i];

            int resto = soma % 11;
            resto = resto < 2 ? 0 : 11 - resto;
            string digito = resto.ToString();
            temp += digito;
            soma = 0;

            for (int i = 0; i < 13; i++)
                soma += int.Parse(temp[i].ToString()) * m2[i];

            resto = soma % 11;
            resto = resto < 2 ? 0 : 11 - resto;
            digito += resto.ToString();

            return cnpj.EndsWith(digito);
        }

        private void ValidarDados()
        {
            if (string.IsNullOrWhiteSpace(Nome))
                throw new ValidationException("O nome é obrigatório.");

            var partesNome = Nome.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (partesNome.Length < 2)
                throw new ValidationException("Informe pelo menos nome e sobrenome.");

            if (TipoPessoa != 'F' && TipoPessoa != 'J')
                throw new ValidationException("Tipo de pessoa inválido. Utilize 'F' para física ou 'J' para jurídica.");

            if (string.IsNullOrWhiteSpace(Documento))
                throw new ValidationException("O documento é obrigatório.");

            var docNumerico = Regex.Replace(Documento, "[^0-9]", "");

            if (!DataReferencia.HasValue)
                throw new ValidationException(TipoPessoa == 'J'
                    ? "A data de inauguração é obrigatória."
                    : "A data de nascimento é obrigatória.");

            if (DataReferencia > DateTime.Today)
                throw new ValidationException("A data informada não pode ser futura.");

            if (TipoPessoa == 'F')
            {
                if (!ValidarCPF(docNumerico))
                    throw new ValidationException("CPF inválido.");

                if (!string.IsNullOrWhiteSpace(InscricaoEstadual))
                    throw new ValidationException("Inscrição Estadual não deve ser informada para pessoa física.");

                var idade = DateTime.Today.Year - DataReferencia.Value.Year;
                if (DataReferencia.Value > DateTime.Today.AddYears(-idade)) idade--;
                if (idade < 0)
                    throw new ValidationException("A data de nascimento é inválida.");
            }

            if (TipoPessoa == 'J')
            {
                if (!ValidarCNPJ(docNumerico))
                    throw new ValidationException("CNPJ inválido.");

                if (!string.IsNullOrWhiteSpace(RG))
                    throw new ValidationException("RG não deve ser informado para pessoa jurídica.");
            }
        }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            ValidarDados();

            if (await _clientesDAO.VerificarExistenciaPorDocumentoAsync(dbContext, Documento))
                throw new ValidationException("Já existe um cliente com esse documento.");

            return await _clientesDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            ValidarDados();

            if (await _clientesDAO.VerificarExistenciaPorDocumentoAsync(dbContext, Documento, Id))
                throw new ValidationException("Já existe outro cliente com esse documento.");

            var ok = await _clientesDAO.AtualizarAsync(dbContext, this);
            if (!ok)
                throw new ValidationException("Cliente não encontrado.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            var ok = await _clientesDAO.InativarAsync(dbContext, Id);
            if (!ok)
                throw new ValidationException("Cliente não encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var ok = await _clientesDAO.ReativarAsync(dbContext, Id);
            if (!ok)
                throw new ValidationException("Cliente não encontrado.");
        }

        public static async Task<IEnumerable<Cliente>> ObterTodosAsync(DBContext dbContext)
            => await _clientesDAO.ObterTodosAsync(dbContext);

        public static async Task<Cliente?> ObterPorIdAsync(DBContext dbContext, int id)
            => await _clientesDAO.ObterPorIdAsync(dbContext, id);
    }
}