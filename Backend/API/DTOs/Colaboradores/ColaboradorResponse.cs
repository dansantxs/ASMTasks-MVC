namespace API.DTOs.Colaboradores
{
    public class ColaboradorResponse
    {
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
        public bool PossuiTarefasAtivas { get; set; } = false;
        public int SetorId { get; set; }
        public int CargoId { get; set; }
    }
}
