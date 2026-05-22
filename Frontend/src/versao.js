export const VERSAO_ATUAL = '1.2.0';

/**
 * Regra de versionamento (major.minor.patch):
 *  - patch: correções de bugs, ajustes visuais
 *  - minor: novas funcionalidades sem quebra de compatibilidade → zera patch
 *  - major: mudanças estruturais grandes → zera minor e patch
 *
 * Ao lançar uma versão:
 *  1. Atualize VERSAO_ATUAL acima.
 *  2. Adicione uma nova entrada NO INÍCIO do array CHANGELOG.
 */
export const CHANGELOG = [
  {
    versao: '1.2.0',
    data: '2026-05-22',
    titulo: 'Kanban, Relatórios e Cadastro de Clientes',
    mudancas: [
      'Indicador de anexos nas tarefas: cards do Kanban, detalhes da tarefa, formulário e visualização do projeto',
      'Nome do cliente nos cards e relatórios respeita a configuração de Razão Social / Nome Fantasia',
      'Busca de clientes na tela de cadastro inclui Nome Fantasia e Razão Social',
      'Ordenação da lista de clientes conforme configuração de exibição',
      'Relatório de clientes agora exibe coluna Nome Fantasia',
      'Relatório histórico de tarefas inclui a observação registrada na pausa',
      'Clientes pessoa física agora podem ter Nome Fantasia e Inscrição Estadual',
      'Indicação "Filial de" respeita a configuração de exibição de nome',
      'Correção: erro ao mesclar projetos com tarefas sem setor definido',
      'Correção: verificação de tarefa em andamento agora considera o responsável da tarefa, não quem clicou',
      'Correção: combo de cliente no cadastro de projeto agora ordena conforme configuração de exibição (Razão Social / Nome Fantasia)',
    ],
  },
  {
    versao: '1.1.0',
    data: '2026-05-20',
    titulo: 'Filiais, Nome Fantasia e Exibição de Clientes',
    mudancas: [
      'Clientes PJ agora suportam o campo Nome Fantasia',
      'Hierarquia de clientes: cadastro de matrizes e suas filiais',
      'Nova configuração de sistema: exibir Razão Social ou Nome Fantasia nas listas',
      'Formulários de Projeto e Atendimento filtram apenas clientes matriz',
      'Combos de clientes ordenadas em ordem alfabética',
    ],
  },
  {
    versao: '1.0.0',
    data: '2026-04-25',
    titulo: 'Lançamento inicial do sistema',
    mudancas: [
      'Módulos de Atendimentos, Projetos e Kanban',
      'Cadastros: cargos, setores, etapas, prioridades, clientes e colaboradores',
      'Relatórios exportáveis em Excel e PDF',
      'Dashboard com KPIs e rankings',
      'Sistema de notificações em tempo real',
      'Tour guiado em todas as telas',
    ],
  },
];
