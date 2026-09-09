export const VERSAO_ATUAL = '1.10.0';

/**
 * Regra de versionamento (major.minor.patch):
 *  - patch: correções de bugs, ajustes visuais, ajustes menores (ordenação, textos, limites)
 *  - minor: novas funcionalidades sem quebra de compatibilidade → zera patch
 *  - major: mudanças estruturais grandes → zera minor e patch
 *
 * Lições de versões passadas (não repetir):
 *  - Uma versão feita só de correções/ajustes é PATCH, mesmo que sejam muitas
 *    (ex.: a 1.6.0 deveria ter sido 1.5.1).
 *  - Não faça dois bumps no mesmo dia: se ainda não foi para produção, junte tudo
 *    na mesma entrada.
 *  - Todo código que vai para produção precisa de uma linha no changelog, inclusive fix.
 *
 * Ao lançar uma versão:
 *  1. Atualize VERSAO_ATUAL acima.
 *  2. Adicione uma nova entrada NO INÍCIO do array CHANGELOG.
 */
export const CHANGELOG = [
  {
    versao: '1.10.0',
    data: '2026-09-09',
    titulo: 'Dashboard Reformulado, Ordenação no Kanban e Aprovação na Comissão',
    mudancas: [
      'Quadro Kanban: nova opção "Ordenar por" — alterne entre Prioridade e Lançamento (data em que a tarefa foi lançada), com botão para inverter a ordem; a escolha fica salva no navegador e a data aparece no cartão quando a ordenação é por lançamento',
      'Dashboard: novo seletor de período (Mês atual, Mês anterior, Últimos 30 dias) — os indicadores "do mês" não zeram mais na virada do mês, e logo depois do dia 1º dá para olhar o mês que fechou',
      'Dashboard: os números dos cards e as listas que eles abrem passam a sair da mesma consulta, então não divergem mais; quando a lista é grande, o card avisa que está mostrando só uma parte',
      'Dashboard: correção de "Em Andamento", que contava também as tarefas do backlog e as já concluídas, e por isso distorcia os percentuais do gráfico por etapa',
      'Dashboard: correção do ranking de tarefas concluídas — tarefa reaberta e reconcluída contava duas vezes, e o crédito ia para o responsável atual em vez de quem realmente fez a etapa',
      'Dashboard: correção de "Projetos Concluídos", que usava a data de cadastro do projeto — passa a usar a data em que o projeto foi realmente concluído',
      'Dashboard: todos os indicadores passam a ter lista — passe o mouse por cima de qualquer card, barra ou linha de ranking para ver os itens que formam o número, inclusive as barras por etapa e o backlog; clique para fixar a lista aberta',
      'Dashboard: cada indicador ganhou uma descrição curta explicando exatamente o que ele conta',
      'Dashboard: as listas de tarefas ficaram mais detalhadas — projeto, cliente, responsável, etapa, status atual e quem mexeu por último, com data e hora',
      'Dashboard: os rankings deixam de mostrar só os 5 primeiros e ganham a opção "Ver todos"',
      'Dashboard: indicadores reorganizados em seções separadas (Atendimentos, Tarefas — Situação Atual, Tarefas — Alertas, Tarefas — Distribuição, Produção do Período, Projetos e Riscos); "Pendentes (total)" e "Projetos cadastrados hoje" viraram recortes do período, e "Tarefas atribuídas" virou a barra de Carga por Colaborador',
      'Dashboard: ao filtrar por um colaborador, as seções de Projetos, Riscos e os rankings passam a respeitar o filtro em vez de continuar mostrando os números da equipe inteira',
      'Relatório de Comissão: novo filtro "Aprovado por" — mostra apenas os itens cuja etapa de aprovação foi feita pelo colaborador escolhido; o nome de quem aprovou aparece no cabeçalho de cada item e no resumo de filtros das exportações',
      'Relatório de Comissão: a lista do filtro "Aprovado por" traz só quem realmente aprovou algum item no período, em vez de todos os colaboradores — assim nenhuma opção oferecida devolve relatório vazio; ao trocar o período, se o escolhido não aprovou nada na nova janela, o filtro volta para "Todos"',
      'Relatório de Comissão: a primeira linha de cada item passa a se chamar "Atendimento" (antes "Lançado por") — é quem recebeu a demanda do cliente e a lançou',
      'Etapas: instalações novas passam a vir com os nomes usados no dia a dia (Atendimento, Elaboração, Aprovação, Atualização e Concluído). Em bases já existentes os nomes são alterados na tela de Etapas, mas isso sozinho não corrige o histórico já gravado: cada linha guarda uma cópia do nome da etapa, e é dela que o Relatório de Comissão lê — o realinhamento do histórico foi feito por script, uma vez por banco',
      'Projetos: na visão de Lista, as colunas passam a começar por Cliente e Cadastro, seguidas de Projeto, Tarefas e Status',
      'Manutenção: os arquivos de migration foram eliminados — o schema.sql passa a ser a fonte única da estrutura do banco',
    ],
  },
  {
    versao: '1.9.0',
    data: '2026-09-02',
    titulo: 'Autoria de Tarefas e Projetos e Reformulação do Relatório de Comissão',
    mudancas: [
      'Kanban: cada tarefa passa a registrar quem a lançou (na criação do projeto, ao adicionar tarefas a um projeto existente e ao duplicar) — exibido no detalhe da tarefa (ícone de visualização). Editar uma tarefa já existente não altera a autoria dela',
      'Kanban: além de quem lançou a tarefa, passa a ser gravada a data/hora do lançamento (tarefas antigas herdam a data do projeto)',
      'Cadastro de projeto: ao editar, o campo passa a mostrar quem realmente lançou o projeto (antes exibia quem estava editando); a tela de edição e a visualização do projeto agora também indicam quem foi o último a alterá-lo e quando',
      'Relatório de Comissão: os itens agora são agrupados por Colaborador(Desenvolvedor) — quem fez a etapa de desenvolvimento da tarefa (ou concluiu o atendimento) — e numerados dentro de cada colaborador',
      'Relatório de Comissão: nova opção de ordenação dos itens dentro do colaborador — por Cliente ou por Data',
      'Relatório de Comissão: nova visão Resumo, mostrando apenas o total por colaborador (contando somente desenvolvimento e atendimentos concluídos, conforme o filtro de tipo)',
      'Relatório de Comissão: ao filtrar por um colaborador, aparecem todos os itens em que ele participou de qualquer etapa e todas as etapas continuam visíveis, inclusive as de outras pessoas',
      'Relatório de Comissão: cada tarefa e cada atendimento passam a mostrar a linha "Lançado por" como primeira etapa (para atendimento, também é gravada a data/hora do lançamento)',
      'Relatório de Comissão: etapas repetidas na mesma tarefa (reabertas) agora aparecem só na ocorrência mais recente; o atendimento concluído aparece uma única vez, no colaborador que concluiu',
      'Relatório de Comissão: nova coluna Descrição (da tarefa/atendimento), que pode ser ocultada na seleção de colunas',
      'Relatório de Comissão: período padrão passa a ser o último mês completo (o anterior ao atual)',
      'Relatório de Comissão: contador do topo simplificado para o total de itens',
      'Relatório de Comissão: botão de ajuda (tour guiado), igual aos demais relatórios',
    ],
  },
  {
    versao: '1.8.0',
    data: '2026-08-31',
    titulo: 'Busca por Digitação nos Dropdowns e Descrição do Atendimento no Relatório',
    mudancas: [
      'Relatório de Histórico de Atendimentos: nova coluna Descrição do Atendimento (também considerada na busca por texto)',
      'Campos de seleção com muitas opções (cliente, colaborador, projeto, empresa matriz, setor, cargo) agora têm campo de busca por digitação — cadastro de projeto e atendimento, formulário de cliente e de colaborador, troca de responsável no Kanban, filtro do Dashboard, filtros do Quadro Kanban e filtros dos relatórios',
      'Correção: blocos de cor maciços (azul) no Google Chrome 109 / Windows 7 em telas que ainda não tinham sido ajustadas',
    ],
  },
  {
    versao: '1.7.0',
    data: '2026-08-31',
    titulo: 'Relatório de Comissão',
    mudancas: [
      'Novo relatório de Comissão, em Relatórios: lista tarefas que já chegaram na etapa final e atendimentos concluídos no período, agrupados por cliente e tarefa/atendimento, mostrando cada etapa percorrida, o colaborador responsável e a data',
      'Filtros por período, colaborador, cliente e tipo (Tarefas/Atendimentos), com seleção de colunas e ordenação, igual aos demais relatórios',
      'Passagens de etapa sem responsável definido não aparecem no relatório, já que não geram comissão',
      'Exportação em Excel e PDF',
      'Correção: variável de ambiente do Docker sobrescrevia a duração da sessão configurada em 12 horas, fazendo o token expirar antes do esperado',
    ],
  },
  {
    versao: '1.6.0',
    data: '2026-08-26',
    titulo: 'Correções de Sessão, Agenda e Dashboard',
    mudancas: [
      'Correção: sessão às vezes expirava bem antes do tempo configurado — a rota de login calculava a validade do cookie de um jeito que podia cair num valor menor por engano; agora usa sempre o mesmo horário de expiração retornado pelo servidor',
      'Sessão ampliada: token de autenticação agora expira em 12 horas (antes 4 horas)',
      'Correção: ao cadastrar um novo atendimento no fim da tarde, o horário sugerido pulava para o dia seguinte cedo demais (até 1h antes do fim do expediente); agora só sugere o dia seguinte depois que o expediente realmente encerrar',
      'Correção: usuário comum via, nos indicadores "Em Atraso — Execução" e "Em Atraso — Teste" do Dashboard, tarefas atrasadas de outros colaboradores, não só as suas',
      'Atendimentos: filtro de colaboradores da agenda e combo de usuário do relatório de histórico de atendimentos agora aparecem em ordem alfabética',
      'Atendimentos: ao cadastrar um novo atendimento, o usuário logado já vem marcado na lista de colaboradores do atendimento',
    ],
  },
  {
    versao: '1.5.0',
    data: '2026-08-24',
    titulo: 'Anexos Bancários, Notificação Nativa, Ordenação de Listas e Agenda de Atendimentos',
    mudancas: [
      'Anexos de tarefa agora aceitam também arquivos XML, OFX, REM e RET, além de imagens, PDF e Excel',
      'Configurações do sistema: novo campo de limite de tamanho específico para XML/OFX/REM/RET, seguindo o mesmo padrão de imagens, PDF e Excel',
      'Notificações do sistema agora também aparecem como notificação nativa do Windows (via Chrome/Edge) — pede permissão do navegador na primeira vez',
      'Correção: a verificação de conflito de horário na agenda de atendimentos não considera mais atendimentos já concluídos, apenas os agendados',
      'Correção: notificação marcada como lida agora some da lista, em vez de continuar aparecendo com a etiqueta "Lida" para sempre',
      'Cliente: lista de busca (lupa) nas telas de Atendimento e Projeto, e o combo de cliente do Atendimento, agora exibem os clientes em ordem alfabética, respeitando a configuração de Razão Social / Nome Fantasia',
      'Atendimentos: o horário inicial de um novo atendimento agora vem preenchido com o horário atual, dentro do expediente configurado',
      'Atendimentos: novo campo "Sem horário de término", para apagar/deixar em branco o horário final do atendimento',
      'Kanban: lista de colaboradores no filtro e na atribuição de responsável da tarefa agora aparece em ordem alfabética',
      'Kanban: filtro de projeto agora aparece em ordem alfabética',
      'Kanban: filtro de colaborador ganhou a opção "Sem responsável", para listar tarefas sem responsável atribuído',
    ],
  },
  {
    versao: '1.4.1',
    data: '2026-08-21',
    titulo: 'Organização de Documentação e Banco de Dados',
    mudancas: [
      'Documentação: todos os comandos PowerShell usados no dia a dia (setup, subir containers, atualizar o servidor, backup, restore e console SQL) agora estão reunidos em um único guia (GUIA-POWERSHELL.md)',
      'Banco de dados: correção do script de criação do banco (schema.sql) — um banco novo criado do zero já nasce com as colunas de Tempo de Execução/Teste e Etapa de Teste, sem precisar de migration separada',
      'Limpeza: removidos scripts e migrations já aplicados que não eram mais necessários no repositório',
    ],
  },
  {
    versao: '1.4.0',
    data: '2026-08-19',
    titulo: 'Cronômetro Flutuante da Tarefa em Execução',
    mudancas: [
      'Nova barra flutuante, visível em qualquer tela do sistema, mostrando o cronômetro da tarefa em execução com opção de pausar direto por ali',
      'Novo botão para abrir o cronômetro em uma mini-janela sempre no topo (Picture-in-Picture), que continua visível mesmo com o navegador minimizado — disponível no Chrome e Edge',
    ],
  },
  {
    versao: '1.3.3',
    data: '2026-08-19',
    titulo: 'Correção de Sessão Expirando Cedo Demais',
    mudancas: [
      'Correção: sessão não durava mais o tempo esperado — havia um logout automático por 30 min de inatividade que derrubava o usuário antes do token expirar',
      'Sessão agora dura exatamente o tempo do token de autenticação (4 horas), sem logout por inatividade',
      'Se a sessão expirar sem logout manual, qualquer tarefa deixada em andamento é pausada automaticamente (ex.: esqueceu de pausar antes do almoço ou ao sair)',
    ],
  },
  {
    versao: '1.3.2',
    data: '2026-08-18',
    titulo: 'Compatibilidade com Chrome 109 / Windows 7 e Desempenho',
    mudancas: [
      'Correção: bugs visuais no Google Chrome 109 (Windows 7) — cabeçalhos de tabela, dropdowns e cores apareciam quebrados. As cores modernas (oklch/color-mix) agora têm equivalente compatível com o navegador',
      'Desempenho: ao trabalhar com clientes que têm muitos lançamentos, a listagem de projetos passou a ser paginada (30 por página), reduzindo a lentidão',
      'Desempenho: Quadro Kanban otimizado — arrastar tarefas ficou mais fluido em quadros com muitas tarefas',
      'Desempenho: telas deixam de refazer buscas desnecessárias ao alternar janelas/abas, reduzindo o reprocessamento de listas grandes',
      'Desempenho: listagem de projetos no servidor otimizada (uma única consulta de tarefas em vez de uma por projeto)',
      'Tela de login: removido o rodapé de direitos autorais',
    ],
  },
  {
    versao: '1.3.1',
    data: '2026-06-06',
    titulo: 'Correções de Status, Dashboard e Combos de Cliente',
    mudancas: [
      'Correção: tarefa pausada que tem sua etapa trocada agora aparece como Ociosa (não mais Pausada)',
      'Correção: lista de tarefas exibida ao passar o mouse nos indicadores do Dashboard agora permite rolar com a barra de rolagem sem fechar a lista',
      'Correção: combo de Empresa Matriz no cadastro de clientes agora exibe e ordena conforme a configuração de Razão Social / Nome Fantasia do sistema',
      'Correção: modal de busca de Matriz no cadastro de clientes agora exibe conforme parametrização',
      'Correção: lista de clientes no diálogo de duplicação de projeto agora exibe e ordena conforme parametrização',
      'Correção: filtro de Cliente no Quadro Kanban agora exibe e ordena conforme parametrização',
      'Sessão ampliada: token de autenticação agora expira em 4 horas (antes 2 horas)',
      'Correção: no formulário de projeto, ao digitar um título diferente para o projeto, a descrição deixa de ser sincronizada com a tarefa',
      'Dashboard: todos os indicadores agora exibem lista detalhada ao passar o mouse (atendimentos, tarefas e projetos)',
      'Correção: nome do cliente nas listas do Dashboard respeita a configuração de Razão Social / Nome Fantasia',
    ],
  },
  {
    versao: '1.3.0',
    data: '2026-05-27',
    titulo: 'Tempo de Execução, Status Visual e Melhorias no Dashboard e Relatório',
    mudancas: [
      'Tarefas agora suportam Tempo de Execução e Tempo de Teste (valor + unidade: Dias/Horas/Minutos)',
      'Etapas podem ser marcadas como Etapa de Teste — o tempo acumulado nessas etapas é contabilizado separadamente',
      'Kanban: badge visual de status por tarefa — Em andamento (verde), Pausada (âmbar) ou Ociosa (cinza)',
      'Kanban: detalhe da tarefa exibe o tempo de execução e de teste configurados',
      'Dashboard: novos indicadores — Tarefas em Atraso (Execução), Tarefas em Atraso (Teste) e Tarefas Ociosas',
      'Relatório de histórico de tarefas: novo filtro por Etapa',
      'Relatório de histórico de tarefas: toggle "Última ocorrência por tarefa/etapa"',
      'Relatório de histórico de tarefas: contagem de tarefas distintas exibida na tela, no PDF e no Excel',
      'Dashboard: ao passar o mouse nos indicadores "Em Atraso — Execução", "Em Atraso — Teste" e "Tarefas Ociosas" (quando valor > 0), exibe lista das tarefas com colaborador e etapa',
      'Correção: filtro por etapa no relatório de histórico de tarefas não exibia mais eventos de "Projeto Concluído" sem etapa associada',
      'Correção: eventos de Início e Pausa de elaboração agora registram a etapa atual da tarefa no histórico, permitindo filtrar por colaborador + etapa no relatório',
      'Correção: eventos de Mudança de Etapa agora registram o colaborador responsável; quando etapa e colaborador mudam simultaneamente, a atribuição é gravada antes da mudança de etapa',
    ],
  },
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
