namespace API.DTOs.Dashboard
{
    public class DashboardDTO
    {
        public bool EhAdministrador { get; set; }
        public DashboardFiltroDTO? Filtro { get; set; }
        public DashboardPeriodoDTO Periodo { get; set; } = new();
        public DashboardAtendimentosDTO Atendimentos { get; set; } = new();
        public DashboardTarefasDTO Tarefas { get; set; } = new();
        public DashboardProjetosDTO? Projetos { get; set; }
        public DashboardColaboradoresDTO? Colaboradores { get; set; }
        public List<ProjetoSemMovimentacaoDTO> ProjetosSemMovimentacao { get; set; } = new();
        public List<ColaboradorFiltroItemDTO> ColaboradoresDisponiveis { get; set; } = new();
    }

    public class DashboardFiltroDTO
    {
        public int ColaboradorId { get; set; }
        public string ColaboradorNome { get; set; } = "";
    }

    /// <summary>
    /// Janela de tempo dos indicadores "do período". Fim é EXCLUSIVO: as consultas usam
    /// [Inicio, Fim), que além de pegar o dia inteiro sem depender da hora, permite índice.
    /// </summary>
    public class DashboardPeriodoDTO
    {
        public string Id { get; set; } = "mesAtual";
        public string Label { get; set; } = "";
        public DateTime Inicio { get; set; }
        public DateTime Fim { get; set; }
    }

    /// <summary>
    /// Indicador = número + a lista que o compõe. `Total` é a contagem real (vem de
    /// COUNT(*) OVER() na mesma consulta que monta a lista, então nunca diverge dela);
    /// `Itens` é limitado a <see cref="DashboardIndicadorDTO.LimitePadrao"/> linhas.
    /// </summary>
    public class DashboardIndicadorDTO
    {
        public const int LimitePadrao = 100;

        public int Total { get; set; }
        public List<DashboardLinhaDTO> Itens { get; set; } = new();
    }

    /// <summary>
    /// Uma linha de lista de indicador. Serve para tarefa, atendimento e projeto — os campos
    /// que não fazem sentido para o tipo vêm nulos e a tela simplesmente não os mostra.
    /// </summary>
    public class DashboardLinhaDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = "";
        public string? ProjetoTitulo { get; set; }
        public string? ClienteNome { get; set; }
        public string? ColaboradorNome { get; set; }
        public string? EtapaNome { get; set; }
        public string? StatusAtual { get; set; }
        /// <summary>Desde quando está assim: atribuição da tarefa, ou agendamento do atendimento.</summary>
        public DateTime? DesdeQuando { get; set; }
        /// <summary>Quem mexeu por último e quando — responde "quem está mexendo, quando".</summary>
        public string? UltimaAcaoPor { get; set; }
        public DateTime? UltimaAcaoEm { get; set; }
    }

    public class DashboardAtendimentosDTO
    {
        public DashboardIndicadorDTO Hoje { get; set; } = new();
        public DashboardIndicadorDTO PendentesPeriodo { get; set; } = new();
        public DashboardIndicadorDTO EmAtraso { get; set; } = new();
        public DashboardIndicadorDTO RealizadosPeriodo { get; set; } = new();
        public List<TendenciaMensalDTO> Tendencia { get; set; } = new();
        public List<ProximoAtendimentoDTO> Proximos { get; set; } = new();
    }

    public class TendenciaMensalDTO
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public int Total { get; set; }
        public string Label { get; set; } = "";
    }

    public class ProximoAtendimentoDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = "";
        public string ClienteNome { get; set; } = "";
        public DateTime DataHoraInicio { get; set; }
    }

    public class DashboardTarefasDTO
    {
        /// <summary>Tarefas em alguma etapa que não é a final — o trabalho realmente em curso.</summary>
        public DashboardIndicadorDTO EmAndamento { get; set; } = new();
        public DashboardIndicadorDTO Backlog { get; set; } = new();
        public DashboardIndicadorDTO SemResponsavel { get; set; } = new();
        public DashboardIndicadorDTO Ociosas { get; set; } = new();
        public DashboardIndicadorDTO ExecucaoEmAtraso { get; set; } = new();
        public DashboardIndicadorDTO TesteEmAtraso { get; set; } = new();
        public DashboardIndicadorDTO ConcluidasPeriodo { get; set; } = new();
        public List<TarefaPorEtapaDTO> PorEtapa { get; set; } = new();
        public List<TarefaPorPrioridadeDTO> PorPrioridade { get; set; } = new();
        public List<CargaColaboradorDTO> CargaPorColaborador { get; set; } = new();
    }

    /// <summary>
    /// Distribuição por etapa, cada faixa com as tarefas que a compõem. `EtapaId` nulo = Backlog.
    /// </summary>
    public class TarefaPorEtapaDTO
    {
        public int? EtapaId { get; set; }
        public string Etapa { get; set; } = "";
        public int Ordem { get; set; }
        public bool EhEtapaFinal { get; set; }
        public int Total { get; set; }
        public List<DashboardLinhaDTO> Itens { get; set; } = new();
    }

    public class TarefaPorPrioridadeDTO
    {
        public string Prioridade { get; set; } = "";
        public string Cor { get; set; } = "";
        public int Ordem { get; set; }
        public int Total { get; set; }
        public List<DashboardLinhaDTO> Itens { get; set; } = new();
    }

    /// <summary>Quantas tarefas abertas cada colaborador tem hoje — foto, não métrica de período.</summary>
    public class CargaColaboradorDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public int Total { get; set; }
        public List<DashboardLinhaDTO> Itens { get; set; } = new();
    }

    public class DashboardProjetosDTO
    {
        public DashboardIndicadorDTO Ativos { get; set; } = new();
        public DashboardIndicadorDTO ConcluidosPeriodo { get; set; } = new();
        public DashboardIndicadorDTO CadastradosPeriodo { get; set; } = new();
    }

    public class DashboardColaboradoresDTO
    {
        public List<TopColaboradorDTO> AtendimentosPeriodo { get; set; } = new();
        public List<TopColaboradorDTO> TarefasConcluidasPeriodo { get; set; } = new();
        public List<ColaboradorOciosoDTO> SemTarefasAtribuidas { get; set; } = new();
    }

    public class ColaboradorOciosoDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
        public string SetorNome { get; set; } = "";
    }

    public class ProjetoSemMovimentacaoDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = "";
        public string ClienteNome { get; set; } = "";
        public DateTime? UltimaMovimentacao { get; set; }
        public int DiasParado { get; set; }
    }

    public class TopColaboradorDTO
    {
        public string Nome { get; set; } = "";
        public int Total { get; set; }
    }

    public class ColaboradorFiltroItemDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = "";
    }
}
