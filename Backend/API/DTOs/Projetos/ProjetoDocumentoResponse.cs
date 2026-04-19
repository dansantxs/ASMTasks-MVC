namespace API.DTOs.Projetos
{
    public class ProjetoDocumentoResponse
    {
        // Projeto
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public DateTime DataCadastro { get; set; }
        public bool Ativo { get; set; }
        public bool Concluido { get; set; }

        // Setor
        public string SetorNome { get; set; } = string.Empty;

        // Responsável pelo cadastro
        public string CadastradoPorNome { get; set; } = string.Empty;

        // Cliente
        public int ClienteId { get; set; }
        public string ClienteNome { get; set; } = string.Empty;
        public string ClienteDocumento { get; set; } = string.Empty;
        public string ClienteTipoPessoa { get; set; } = string.Empty;
        public string? ClienteEmail { get; set; }
        public string? ClienteTelefone { get; set; }
        public string? ClienteCidade { get; set; }
        public string? ClienteUf { get; set; }
        public string? ClienteLogradouro { get; set; }
        public string? ClienteBairro { get; set; }
        public int? ClienteNumero { get; set; }
        public string? ClienteCep { get; set; }

        // Tarefas com nomes resolvidos
        public List<ProjetoDocumentoTarefaResponse> Tarefas { get; set; } = new();
    }
}
