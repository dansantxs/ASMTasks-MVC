using API.DB;
using API.DB.DAOs;
using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class Atendimento
    {
        private static readonly AtendimentosDAO _atendimentosDAO = new AtendimentosDAO();

        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int ClienteId { get; set; }
        public int CadastradoPorColaboradorId { get; set; }
        public DateTime DataHoraInicio { get; set; }
        public DateTime? DataHoraFim { get; set; }
        public char Status { get; set; } = 'A';
        public bool Ativo { get; set; } = true;
        public DateTime DataCadastro { get; set; }
        public List<int> ColaboradoresIds { get; set; } = new List<int>();

        private void ValidarDados()
        {
            if (string.IsNullOrWhiteSpace(Titulo))
                throw new ValidationException("O titulo do atendimento e obrigatorio.");

            if (DataHoraInicio == default)
                throw new ValidationException("A data/hora de inicio do atendimento e obrigatoria.");

            if (DataHoraFim.HasValue && DataHoraFim.Value <= DataHoraInicio)
                throw new ValidationException("A data/hora de fim deve ser maior que a data/hora de inicio.");

            if (ClienteId <= 0)
                throw new ValidationException("O cliente do atendimento e obrigatorio.");

            if (CadastradoPorColaboradorId <= 0)
                throw new ValidationException("O colaborador que esta cadastrando e obrigatorio.");

            if (ColaboradoresIds == null || !ColaboradoresIds.Any())
                throw new ValidationException("Informe ao menos um colaborador para o atendimento.");

            if (ColaboradoresIds.Any(id => id <= 0))
                throw new ValidationException("Lista de colaboradores contem IDs invalidos.");
        }

        private async Task ValidarEntidadesRelacionadasAsync(DBContext dbContext)
        {
            var cliente = await Cliente.ObterPorIdAsync(dbContext, ClienteId);
            if (cliente == null || !cliente.Ativo)
                throw new ValidationException("O cliente informado nao existe ou esta inativo.");

            var colaboradorCadastro = await Colaborador.ObterPorIdAsync(dbContext, CadastradoPorColaboradorId);
            if (colaboradorCadastro == null || !colaboradorCadastro.Ativo)
                throw new ValidationException("O colaborador que esta cadastrando nao existe ou esta inativo.");

            foreach (var colaboradorId in ColaboradoresIds.Distinct())
            {
                var colaborador = await Colaborador.ObterPorIdAsync(dbContext, colaboradorId);
                if (colaborador == null || !colaborador.Ativo)
                    throw new ValidationException($"Colaborador invalido ou inativo: ID {colaboradorId}.");
            }
        }

        private async Task ValidarConflitosHorarioAsync(DBContext dbContext, int? atendimentoIdIgnorar = null)
        {
            foreach (var colaboradorId in ColaboradoresIds.Distinct())
            {
                var existeConflito = await _atendimentosDAO.ExisteConflitoHorarioAsync(
                    dbContext,
                    colaboradorId,
                    DataHoraInicio,
                    DataHoraFim,
                    atendimentoIdIgnorar);

                if (existeConflito)
                {
                    var colaborador = await Colaborador.ObterPorIdAsync(dbContext, colaboradorId);
                    var nomeColaborador = colaborador?.Nome ?? $"ID {colaboradorId}";
                    throw new ValidationException($"Conflito de horario para o colaborador {nomeColaborador}.");
                }
            }
        }

        public async Task<int> CriarAsync(DBContext dbContext)
        {
            ValidarDados();
            await ValidarEntidadesRelacionadasAsync(dbContext);
            await ValidarConflitosHorarioAsync(dbContext);

            Ativo = true;
            Status = 'A';
            DataCadastro = DateTime.Now;
            ColaboradoresIds = ColaboradoresIds.Distinct().ToList();

            return await _atendimentosDAO.CriarAsync(dbContext, this);
        }

        public async Task AtualizarAsync(DBContext dbContext)
        {
            if (Status == 'R')
                throw new ValidationException("Nao e permitido editar um atendimento concluido.");

            ValidarDados();
            await ValidarEntidadesRelacionadasAsync(dbContext);
            await ValidarConflitosHorarioAsync(dbContext, Id);

            ColaboradoresIds = ColaboradoresIds.Distinct().ToList();
            var atualizado = await _atendimentosDAO.AtualizarAsync(dbContext, this);
            if (!atualizado)
                throw new ValidationException("Atendimento nao encontrado.");
        }

        public async Task InativarAsync(DBContext dbContext)
        {
            var inativado = await _atendimentosDAO.InativarAsync(dbContext, Id);
            if (!inativado)
                throw new ValidationException("Atendimento nao encontrado.");
        }

        public async Task ReativarAsync(DBContext dbContext)
        {
            await ValidarConflitosHorarioAsync(dbContext, Id);

            var reativado = await _atendimentosDAO.ReativarAsync(dbContext, Id);
            if (!reativado)
                throw new ValidationException("Atendimento nao encontrado.");
        }

        public async Task MarcarComoRealizadoAsync(DBContext dbContext)
        {
            var atualizado = await _atendimentosDAO.AtualizarStatusAsync(dbContext, Id, 'R');
            if (!atualizado)
                throw new ValidationException("Atendimento nao encontrado.");
        }

        public async Task MarcarComoAgendadoAsync(DBContext dbContext)
        {
            var atualizado = await _atendimentosDAO.AtualizarStatusAsync(dbContext, Id, 'A');
            if (!atualizado)
                throw new ValidationException("Atendimento nao encontrado.");
        }

        public static async Task<IEnumerable<Atendimento>> ObterTodosAsync(DBContext dbContext, DateTime? dataInicio = null, DateTime? dataFim = null)
        {
            return await _atendimentosDAO.ObterTodosAsync(dbContext, dataInicio, dataFim);
        }

        public static async Task<Atendimento?> ObterPorIdAsync(DBContext dbContext, int id)
        {
            return await _atendimentosDAO.ObterPorIdAsync(dbContext, id);
        }
    }
}
