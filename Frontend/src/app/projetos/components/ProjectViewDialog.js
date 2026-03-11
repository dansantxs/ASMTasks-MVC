'use client';

import { Badge } from '../../../ui/base/badge';
import { Button } from '../../../ui/base/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/base/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { FolderKanban, Pencil, RefreshCw, Trash2 } from 'lucide-react';

function formatarDataHora(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizarTexto(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function projetoEstaConcluido(project, etapasById) {
  if (!project.ativo) return false;

  const tarefas = project.tarefas ?? [];
  if (!tarefas.length) return false;

  return tarefas.every((task) => {
    if (!task.etapaId) return false;
    const etapaNome = etapasById.get(task.etapaId);
    return normalizarTexto(etapaNome).includes('conclu');
  });
}

export default function ProjectViewDialog({
  open,
  onOpenChange,
  project,
  clientesById,
  setoresById,
  prioridadesById,
  colaboradoresById,
  etapasById,
  onEdit,
  onInativar,
  onReativar,
  isInativando,
  isReativando,
}) {
  if (!project) return null;

  const clienteNome = clientesById.get(project.clienteId) ?? `Cliente #${project.clienteId}`;
  const setorNome = setoresById.get(project.setorId) ?? `Setor #${project.setorId}`;
  const colaboradorCadastroNome =
    colaboradoresById.get(project.cadastradoPorColaboradorId) ??
    `Colaborador #${project.cadastradoPorColaboradorId}`;
  const status = !project.ativo ? 'Inativo' : projetoEstaConcluido(project, etapasById) ? 'Concluido' : 'Ativo';

  const handleEdit = () => {
    onOpenChange(false);
    onEdit(project);
  };

  const handleInativar = () => {
    onInativar(project.id);
    onOpenChange(false);
  };

  const handleReativar = () => {
    onReativar(project.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-brand-blue" />
            Detalhes do projeto
          </DialogTitle>
          <DialogDescription>
            Visualize os dados completos do projeto e suas tarefas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl">{project.titulo}</CardTitle>
                <Badge
                  variant={project.ativo ? 'default' : 'secondary'}
                  className={status === 'Ativo' ? 'bg-brand-blue hover:bg-brand-blue-dark' : status === 'Concluido' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                >
                  {status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descricao</p>
                  <p className="text-sm">{project.descricao}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p>{clienteNome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Setor</p>
                  <p>{setorNome}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de cadastro</p>
                  <p>{formatarDataHora(project.dataCadastro)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Lancado por</p>
                  <p>{colaboradorCadastroNome}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tarefas ({project.tarefas?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(project.tarefas ?? []).map((task, index) => {
                const prioridadeNome = prioridadesById.get(task.prioridadeId) ?? `Prioridade #${task.prioridadeId}`;

                return (
                  <div key={task.id || `${project.id}-${index}`} className="rounded-md border p-3 bg-muted/20">
                    <p className="text-sm font-medium">{task.titulo}</p>
                    {task.descricao && <p className="text-sm text-muted-foreground mt-1">{task.descricao}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Prioridade: {prioridadeNome}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>

          {project.ativo ? (
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleInativar} disabled={isInativando}>
              <Trash2 className="h-4 w-4 mr-1" />
              Inativar
            </Button>
          ) : (
            <Button
              variant="outline"
              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
              onClick={handleReativar}
              disabled={isReativando}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reativar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
