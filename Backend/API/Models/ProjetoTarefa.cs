using System.ComponentModel.DataAnnotations;

namespace API.Models
{
    public class ProjetoTarefa
    {
        public int Id { get; set; }
        public int ProjetoId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string? Descricao { get; set; }
        public int PrioridadeId { get; set; }
        public int? ColaboradorResponsavelId { get; set; }
        public DateTime? DataHoraAtribuicao { get; set; }
        public int? EtapaId { get; set; }

        public void ValidarDados()
        {
            if (string.IsNullOrWhiteSpace(Titulo))
                throw new ValidationException("O titulo da tarefa e obrigatorio.");

            if (PrioridadeId <= 0)
                throw new ValidationException("A prioridade da tarefa e obrigatoria.");

            if (ColaboradorResponsavelId.HasValue && ColaboradorResponsavelId.Value <= 0)
                throw new ValidationException("O colaborador responsavel da tarefa e invalido.");

            if (EtapaId.HasValue && EtapaId.Value <= 0)
                throw new ValidationException("A etapa da tarefa e invalida.");

            if (DataHoraAtribuicao.HasValue && !ColaboradorResponsavelId.HasValue)
                throw new ValidationException("A data/hora de atribuicao da tarefa exige colaborador responsavel.");
        }
    }
}
