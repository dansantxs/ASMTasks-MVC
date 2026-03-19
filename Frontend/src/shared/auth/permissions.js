export const permissoesTelas = {
  cadastrosCargos: 'cadastros.cargos',
  cadastrosClientes: 'cadastros.clientes',
  cadastrosColaboradores: 'cadastros.colaboradores',
  cadastrosEtapas: 'cadastros.etapas',
  cadastrosPrioridades: 'cadastros.prioridades',
  cadastrosSetores: 'cadastros.setores',
  atendimentosAgenda: 'atendimentos.agenda',
  projetosCadastro: 'projetos.cadastro',
  relatoriosCargos: 'relatorios.cargos',
  relatoriosClientes: 'relatorios.clientes',
  relatoriosColaboradores: 'relatorios.colaboradores',
  relatoriosEtapas: 'relatorios.etapas',
  relatoriosPrioridades: 'relatorios.prioridades',
  relatoriosSetores: 'relatorios.setores',
  relatoriosAtendimentosHistorico: 'relatorios.atendimentos-historico',
  configuracoesMinhaConta: 'configuracoes.minha-conta',
  configuracoesAcessos: 'configuracoes.acessos',
  configuracoesSistema: 'configuracoes.sistema',
};

const mapeamentoPermissoes = [
  { prefix: '/cadastros/cargos', permission: permissoesTelas.cadastrosCargos },
  { prefix: '/cadastros/clientes', permission: permissoesTelas.cadastrosClientes },
  { prefix: '/cadastros/colaboradores', permission: permissoesTelas.cadastrosColaboradores },
  { prefix: '/cadastros/etapas', permission: permissoesTelas.cadastrosEtapas },
  { prefix: '/cadastros/prioridades', permission: permissoesTelas.cadastrosPrioridades },
  { prefix: '/cadastros/setores', permission: permissoesTelas.cadastrosSetores },
  { prefix: '/atendimentos', permission: permissoesTelas.atendimentosAgenda },
  { prefix: '/projetos', permission: permissoesTelas.projetosCadastro },
  { prefix: '/relatorios/cargos', permission: permissoesTelas.relatoriosCargos },
  { prefix: '/relatorios/clientes', permission: permissoesTelas.relatoriosClientes },
  { prefix: '/relatorios/colaboradores', permission: permissoesTelas.relatoriosColaboradores },
  { prefix: '/relatorios/etapas', permission: permissoesTelas.relatoriosEtapas },
  { prefix: '/relatorios/prioridades', permission: permissoesTelas.relatoriosPrioridades },
  { prefix: '/relatorios/setores', permission: permissoesTelas.relatoriosSetores },
  { prefix: '/relatorios/atendimentos-historico', permission: permissoesTelas.relatoriosAtendimentosHistorico },
  { prefix: '/configuracoes/alterar-senha', permission: permissoesTelas.configuracoesMinhaConta },
  { prefix: '/configuracoes/acessos', permission: permissoesTelas.configuracoesAcessos },
  { prefix: '/configuracoes/sistema', permission: permissoesTelas.configuracoesSistema },
];

const rotasPadrao = [
  { path: '/atendimentos', permission: permissoesTelas.atendimentosAgenda },
  { path: '/projetos', permission: permissoesTelas.projetosCadastro },
  { path: '/cadastros/clientes', permission: permissoesTelas.cadastrosClientes },
  { path: '/cadastros/colaboradores', permission: permissoesTelas.cadastrosColaboradores },
  { path: '/cadastros/cargos', permission: permissoesTelas.cadastrosCargos },
  { path: '/cadastros/setores', permission: permissoesTelas.cadastrosSetores },
  { path: '/cadastros/etapas', permission: permissoesTelas.cadastrosEtapas },
  { path: '/cadastros/prioridades', permission: permissoesTelas.cadastrosPrioridades },
  { path: '/relatorios/clientes', permission: permissoesTelas.relatoriosClientes },
  { path: '/relatorios/atendimentos-historico', permission: permissoesTelas.relatoriosAtendimentosHistorico },
  { path: '/configuracoes/alterar-senha', permission: permissoesTelas.configuracoesMinhaConta },
  { path: '/configuracoes/acessos', permission: permissoesTelas.configuracoesAcessos },
  { path: '/configuracoes/sistema', permission: permissoesTelas.configuracoesSistema },
];

export function temPermissao(sessao, permissao) {
  if (!permissao) return true;
  const permissoes = sessao?.permissoes ?? [];
  return permissoes.includes(permissao);
}

export function obterPermissaoPorRota(caminho) {
  return mapeamentoPermissoes.find((item) => caminho.startsWith(item.prefix))?.permission ?? null;
}

export function obterRotaPadrao(sessao) {
  return rotasPadrao.find((item) => temPermissao(sessao, item.permission))?.path ?? '/login';
}
