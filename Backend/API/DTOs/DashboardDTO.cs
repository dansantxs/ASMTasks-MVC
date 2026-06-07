namespace API.DTOs.Dashboard
{
    public class DashboardDTO
    {
        public bool EhAdministrador { get; set; }
        public DashboardFiltroDTO? Filtro { get; set; }
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

    public class DashboardItemListaDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = "";
        public string? Info { get; set; }
    }

    public class DashboardAtendimentosDTO
    {
        public int Hoje { get; set; }
        public int Agendados { get; set; }
        public int EmAtraso { get; set; }
        public int RealizadosMes { get; set; }
        public List<TendenciaMensalDTO> Tendencia { get; set; } = new();
        public List<ProximoAtendimentoDTO> Proximos { get; set; } = new();
        public List<DashboardItemListaDTO> HojeLista { get; set; } = new();
        public List<DashboardItemListaDTO> PendentesLista { get; set; } = new();
        public List<DashboardItemListaDTO> EmAtrasoLista { get; set; } = new();
        public List<DashboardItemListaDTO> RealizadosMesLista { get; set; } = new();
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
        public int Total { get; set; }
        public int ConcluidasMes { get; set; }
        public int SemResponsavel { get; set; }
        public int TarefasBacklog { get; set; }
        public int TarefasExecucaoEmAtraso { get; set; }
        public int TarefasTesteEmAtraso { get; set; }
        public int TarefasOciosas { get; set; }
        public List<TarefaAlertaDTO> TarefasExecucaoEmAtrasoLista { get; set; } = new();
        public List<TarefaAlertaDTO> TarefasTesteEmAtrasoLista { get; set; } = new();
        public List<TarefaAlertaDTO> TarefasOciosasList { get; set; } = new();
        public List<DashboardItemListaDTO> EmAndamentoLista { get; set; } = new();
        public List<DashboardItemListaDTO> ConcluidasMesLista { get; set; } = new();
        public List<DashboardItemListaDTO> SemResponsavelLista { get; set; } = new();
        public List<TarefaPorEtapaDTO> PorEtapa { get; set; } = new();
        public List<TarefaPorPrioridadeDTO> PorPrioridade { get; set; } = new();
    }

    public class TarefaAlertaDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = "";
        public string? ColaboradorNome { get; set; }
        public string? EtapaNome { get; set; }
    }

    public class TarefaPorEtapaDTO
    {
        public string Etapa { get; set; } = "";
        public int Ordem { get; set; }
        public bool EhEtapaFinal { get; set; }
        public int Total { get; set; }
    }

    public class TarefaPorPrioridadeDTO
    {
        public string Prioridade { get; set; } = "";
        public string Cor { get; set; } = "";
        public int Ordem { get; set; }
        public int Total { get; set; }
    }

    public class DashboardProjetosDTO
    {
        public int Ativos { get; set; }
        public int ConcluidosMes { get; set; }
        public int CadastradosHoje { get; set; }
        public List<DashboardItemListaDTO> AtivoLista { get; set; } = new();
        public List<DashboardItemListaDTO> ConcluidosMesLista { get; set; } = new();
        public List<DashboardItemListaDTO> CadastradosHojeLista { get; set; } = new();
    }

    public class DashboardColaboradoresDTO
    {
        public List<TopColaboradorDTO> TopAtendimentosMes { get; set; } = new();
        public List<TopColaboradorDTO> TopTarefasAtribuidas { get; set; } = new();
        public List<TopColaboradorDTO> TopTarefasConcluidas { get; set; } = new();
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
