export const screenPermissions = {
  cadastrosCargos: 'cadastros.cargos',
  cadastrosClientes: 'cadastros.clientes',
  cadastrosColaboradores: 'cadastros.colaboradores',
  cadastrosEtapas: 'cadastros.etapas',
  cadastrosPrioridades: 'cadastros.prioridades',
  cadastrosSetores: 'cadastros.setores',
  atendimentosAgenda: 'atendimentos.agenda',
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

const routePermissionMatchers = [
  { prefix: '/cadastros/cargos', permission: screenPermissions.cadastrosCargos },
  { prefix: '/cadastros/clientes', permission: screenPermissions.cadastrosClientes },
  { prefix: '/cadastros/colaboradores', permission: screenPermissions.cadastrosColaboradores },
  { prefix: '/cadastros/etapas', permission: screenPermissions.cadastrosEtapas },
  { prefix: '/cadastros/prioridades', permission: screenPermissions.cadastrosPrioridades },
  { prefix: '/cadastros/setores', permission: screenPermissions.cadastrosSetores },
  { prefix: '/atendimentos/agenda', permission: screenPermissions.atendimentosAgenda },
  { prefix: '/relatorios/cargos', permission: screenPermissions.relatoriosCargos },
  { prefix: '/relatorios/clientes', permission: screenPermissions.relatoriosClientes },
  { prefix: '/relatorios/colaboradores', permission: screenPermissions.relatoriosColaboradores },
  { prefix: '/relatorios/etapas', permission: screenPermissions.relatoriosEtapas },
  { prefix: '/relatorios/prioridades', permission: screenPermissions.relatoriosPrioridades },
  { prefix: '/relatorios/setores', permission: screenPermissions.relatoriosSetores },
  { prefix: '/relatorios/atendimentos-historico', permission: screenPermissions.relatoriosAtendimentosHistorico },
  { prefix: '/configuracoes/alterar-senha', permission: screenPermissions.configuracoesMinhaConta },
  { prefix: '/configuracoes/acessos', permission: screenPermissions.configuracoesAcessos },
  { prefix: '/configuracoes/sistema', permission: screenPermissions.configuracoesSistema },
];

const orderedDefaultRoutes = [
  { path: '/atendimentos/agenda', permission: screenPermissions.atendimentosAgenda },
  { path: '/cadastros/clientes', permission: screenPermissions.cadastrosClientes },
  { path: '/cadastros/colaboradores', permission: screenPermissions.cadastrosColaboradores },
  { path: '/cadastros/cargos', permission: screenPermissions.cadastrosCargos },
  { path: '/cadastros/setores', permission: screenPermissions.cadastrosSetores },
  { path: '/cadastros/etapas', permission: screenPermissions.cadastrosEtapas },
  { path: '/cadastros/prioridades', permission: screenPermissions.cadastrosPrioridades },
  { path: '/relatorios/clientes', permission: screenPermissions.relatoriosClientes },
  { path: '/relatorios/atendimentos-historico', permission: screenPermissions.relatoriosAtendimentosHistorico },
  { path: '/configuracoes/alterar-senha', permission: screenPermissions.configuracoesMinhaConta },
  { path: '/configuracoes/acessos', permission: screenPermissions.configuracoesAcessos },
  { path: '/configuracoes/sistema', permission: screenPermissions.configuracoesSistema },
];

export function hasPermission(session, permission) {
  if (!permission) return true;
  const permissions = session?.permissoes ?? [];
  return permissions.includes(permission);
}

export function getPermissionForPath(pathname) {
  return routePermissionMatchers.find((item) => pathname.startsWith(item.prefix))?.permission ?? null;
}

export function getDefaultRouteForSession(session) {
  return orderedDefaultRoutes.find((item) => hasPermission(session, item.permission))?.path ?? '/login';
}
