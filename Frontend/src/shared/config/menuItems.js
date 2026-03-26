import { Briefcase, Building2, Flag, Handshake, History, Users, Workflow } from "lucide-react";
import { permissoesTelas } from "../auth/permissions";

export const cadastroItems = [
  { key: "cargos", label: "Cargos", icon: Briefcase, permission: permissoesTelas.cadastrosCargos },
  { key: "clientes", label: "Clientes", icon: Handshake, permission: permissoesTelas.cadastrosClientes },
  { key: "colaboradores", label: "Colaboradores", icon: Users, permission: permissoesTelas.cadastrosColaboradores },
  { key: "etapas", label: "Etapas", icon: Workflow, permission: permissoesTelas.cadastrosEtapas },
  { key: "prioridades", label: "Prioridades", icon: Flag, permission: permissoesTelas.cadastrosPrioridades },
  { key: "setores", label: "Setores", icon: Building2, permission: permissoesTelas.cadastrosSetores },
];

export const relatorioItems = [
  { key: "cargos", label: "Cargos", icon: Briefcase, permission: permissoesTelas.relatoriosCargos },
  { key: "clientes", label: "Clientes", icon: Handshake, permission: permissoesTelas.relatoriosClientes },
  { key: "colaboradores", label: "Colaboradores", icon: Users, permission: permissoesTelas.relatoriosColaboradores },
  { key: "etapas", label: "Etapas", icon: Workflow, permission: permissoesTelas.relatoriosEtapas },
  { key: "prioridades", label: "Prioridades", icon: Flag, permission: permissoesTelas.relatoriosPrioridades },
  { key: "setores", label: "Setores", icon: Building2, permission: permissoesTelas.relatoriosSetores },
  { key: "atendimentos-historico", label: "Histórico Atend.", icon: History, permission: permissoesTelas.relatoriosAtendimentosHistorico },
  { key: "projetos-historico", label: "Histórico Tarefas", icon: History, permission: permissoesTelas.relatoriosProjetosHistorico },
];
