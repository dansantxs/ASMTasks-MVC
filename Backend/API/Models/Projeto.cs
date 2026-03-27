using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Projeto
    {
        private static readonly ProjetosDAO _projetosDAO = new ProjetosDAO();

        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int CadastradoPorColaboradorId { get; set; }
        public DateTime DataCadastro { get; set; }
        public bool Ativo { get; set; } = true;
        public bool Concluido { get; set; } = false;
        public int SetorId { get; set; }
        public List<ProjetoTarefa> Tarefas { get; set; } = new List<ProjetoTarefa>();

        private void ValidarDados()
        {
            if (string.IsNullOrWhiteSpace(Titulo))
                throw new ValidationException("O titulo do projeto e obrigatorio.");

            if (ClienteId <= 0)
                throw new ValidationException("O cliente do projeto e obrigatorio.");

            if (CadastradoPorColaboradorId <= 0)
                throw new ValidationException("O colaborador que esta cadastrando e obrigatorio.");

            if (SetorId <= 0)
                throw new ValidationException("O setor do projeto e obrigatorio.");

            if (Tarefas == null || !Tarefas.Any())
                throw new ValidationException("Informe ao menos uma tarefa para o projeto.");

            foreach (var tarefa in Tarefas)
                tarefa.ValidarDados();
        }

        private async Task ValidarEntidadesRelacionadasAsync(DBContext dbContext)
        {
            var cliente = await Cliente.ObterPorIdAsync(dbContext, ClienteId);
            if (cliente == null || !cliente.Ativo)
                throw new ValidationException("O cliente informado nao existe ou esta inativo.");

            var colaboradorCadastro = await Colaborador.ObterPorIdAsync(dbContext, CadastradoPorColaboradorId);
            if (colaboradorCadastro == null || !colaboradorCadastro.Ativo)
                throw new ValidationException("O colaborador que esta cadastrando nao existe ou esta inativo.");

            var setor = await Setor.ObterPorIdAsync(dbContext, SetorId);
            if (setor == null || !setor.Ativo)
                throw new ValidationException("O setor informado nao existe ou esta inativo.");

            foreach (var tarefa in Tarefas)
            {
                var prioridade = await Prioridade.ObterPorIdAsync(dbContext, tarefa.PrioridadeId);
                if (prioridade == null || !prioridade.Ativo)
                    throw new ValidationException($"A prioridade da tarefa '{tarefa.Titulo}' e invalida ou esta inativa.");

                if (tarefa.ColaboradorResponsavelId.HasValue)
                {
                    var colaboradorResponsavel = await Colaborador.ObterPorIdAsync(dbContext, tarefa.ColaboradorResponsavelId.Value);
                    if (colaboradorResponsavel == null || !colaboradorResponsavel.Ativo)
                        throw new ValidationException($"O colaborador responsavel da tarefa '{tarefa.Titulo}' e invalido ou esta inativo.");
                }

                if (tarefa.EtapaId.HasValue)
                {
                    var etapa = await Etapa.ObterPorIdAsync(dbContext, tarefa.EtapaId.Value);
                    if (etapa == null || !etapa.Ativo)
                        throw new ValidationException($"A etapa da tarefa '{tarefa.Titulo}' e invalida ou esta inativa.");
                }
            }
        }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            ValidarDados();
            await ValidarEntidadesRelacionadasAsync(dbContext);

            Titulo = Titulo.Trim();
            Descricao = string.IsNullOrWhiteSpace(Descricao) ? null : Descricao.Trim();
            DataCadastro = DateTime.Now;
            Ativo = true;

            foreach (var tarefa in Tarefas)
            {
                tarefa.Titulo = tarefa.Titulo.Trim();
                tarefa.Descricao = string.IsNullOrWhiteSpace(tarefa.Descricao) ? null : tarefa.Descricao.Trim();

                if (!tarefa.ColaboradorResponsavelId.HasValue)
                    tarefa.DataHoraAtribuicao = null;
            }

            return await _projetosDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            ValidarDados();
            await ValidarEntidadesRelacionadasAsync(dbContext);

            Titulo = Titulo.Trim();
            Descricao = string.IsNullOrWhiteSpace(Descricao) ? null : Descricao.Trim();

            foreach (var tarefa in Tarefas)
            {
                tarefa.Titulo = tarefa.Titulo.Trim();
                tarefa.Descricao = string.IsNullOrWhiteSpace(tarefa.Descricao) ? null : tarefa.Descricao.Trim();

                if (!tarefa.ColaboradorResponsavelId.HasValue)
                    tarefa.DataHoraAtribuicao = null;
            }

            var atualizado = await _projetosDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Projeto nao encontrado.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            var inativado = await _projetosDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Projeto nao encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            var reativado = await _projetosDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Projeto nao encontrado.");
        }

        public static async Task<IEnumerable<Projeto>> ObterTodosAsync(DBContext dbContext)
        {
            return await _projetosDAO.ObterTodosAsync(dbContext);
        }

        public static async Task<Projeto?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _projetosDAO.ObterPorIdAsync(dbContext, id);
        }
    }
}
