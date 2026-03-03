import { Briefcase, Building2, Flag, Handshake, Users, Workflow } from "lucide-react";
import { screenPermissions } from "../auth/permissions";

export const cadastroItems = [
  { key: "cargos", label: "Cargos", icon: Briefcase, permission: screenPermissions.cadastrosCargos },
  { key: "clientes", label: "Clientes", icon: Handshake, permission: screenPermissions.cadastrosClientes },
  { key: "colaboradores", label: "Colaboradores", icon: Users, permission: screenPermissions.cadastrosColaboradores },
  { key: "etapas", label: "Etapas", icon: Workflow, permission: screenPermissions.cadastrosEtapas },
  { key: "prioridades", label: "Prioridades", icon: Flag, permission: screenPermissions.cadastrosPrioridades },
  { key: "setores", label: "Setores", icon: Building2, permission: screenPermissions.cadastrosSetores },
];

export const relatorioItems = [
  { key: "cargos", label: "Cargos", icon: Briefcase, permission: screenPermissions.relatoriosCargos },
  { key: "clientes", label: "Clientes", icon: Handshake, permission: screenPermissions.relatoriosClientes },
  { key: "colaboradores", label: "Colaboradores", icon: Users, permission: screenPermissions.relatoriosColaboradores },
  { key: "etapas", label: "Etapas", icon: Workflow, permission: screenPermissions.relatoriosEtapas },
  { key: "prioridades", label: "Prioridades", icon: Flag, permission: screenPermissions.relatoriosPrioridades },
  { key: "setores", label: "Setores", icon: Building2, permission: screenPermissions.relatoriosSetores },
];
