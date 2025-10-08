namespace API.Models
{
    public class Colaborador
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string Cpf { get; set; } = string.Empty;
        public DateTime DataNascimento { get; set; }
        public DateTime DataAdmissao { get; set; } = DateTime.UtcNow;
        public bool Ativo { get; set; } = true;
        public int? SetorId { get; set; }
        public Setor? Setor { get; set; }
        public int CargoId { get; set; }
    }
}