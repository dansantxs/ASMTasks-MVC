'use client';

import { Badge } from '../../../ui/base/badge';
import { Button } from '../../../ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/base/dialog';
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
    return normalizarTexto(etapasById.get(task.etapaId)).includes('conclu');
  });
}

export default function DialogoVisualizarProjeto({
  open,
  onOpenChange,
  projeto,
  clientesById,
  setoresById,
  prioridadesById,
  colaboradoresById,
  etapasById,
  aoEditar,
  onInativar,
  onReativar,
  isInativando,
  isReativando,
}) {
  if (!projeto) return null;

  const clienteNome = clientesById.get(projeto.clienteId) ?? `Cliente #${projeto.clienteId}`;
  const setorNome = setoresById.get(projeto.setorId) ?? `Setor #${projeto.setorId}`;
  const colaboradorCadastroNome =
    colaboradoresById.get(projeto.cadastradoPorColaboradorId) ??
    `Colaborador #${projeto.cadastradoPorColaboradorId}`;
  const status = !projeto.ativo ? 'Inativo' : projetoEstaConcluido(projeto, etapasById) ? 'Concluido' : 'Ativo';
  const tarefas = [...(projeto.tarefas ?? [])].sort((a, b) => {
    const ordemA = prioridadesById.get(a.prioridadeId)?.ordem ?? 9999;
    const ordemB = prioridadesById.get(b.prioridadeId)?.ordem ?? 9999;
    return ordemA - ordemB;
  });

  const handleEdit = () => {
    onOpenChange(false);
    aoEditar(projeto);
  };

  const handleInativar = () => {
    onInativar(projeto.id);
    onOpenChange(false);
  };

  const handleReativar = () => {
    onReativar(projeto.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-brand-blue shrink-0" />
              <DialogTitle className="text-lg leading-tight">{projeto.titulo}</DialogTitle>
            </div>
            <Badge
              variant={projeto.ativo ? 'default' : 'secondary'}
              className={`shrink-0 ${
                status === 'Ativo'
                  ? 'bg-brand-blue hover:bg-brand-blue-dark'
                  : status === 'Concluido'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : ''
              }`}
            >
              {status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {/* Dados do projeto */}
          <div className="px-6 py-4 border-b">
            {projeto.descricao && (
              <p className="text-sm text-muted-foreground mb-3">{projeto.descricao}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium">{clienteNome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Setor</p>
                <p className="font-medium">{setorNome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data de cadastro</p>
                <p className="font-medium">{formatarDataHora(projeto.dataCadastro)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lançado por</p>
                <p className="font-medium">{colaboradorCadastroNome}</p>
              </div>
            </div>
          </div>

          {/* Tarefas */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Tarefas</p>
              <Badge variant="outline">{tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}</Badge>
            </div>

            {tarefas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {tarefas.map((task, index) => {
                  const prioridade = task.prioridadeId ? prioridadesById.get(task.prioridadeId) : null;
                  const prioridadeNome = prioridade?.nome ?? (task.prioridadeId ? `#${task.prioridadeId}` : null);
                  const prioridadeCor = prioridade?.cor;

                  return (
                    <div
                      key={task.id || `${projeto.id}-${index}`}
                      className="rounded-md border-l-4 border border-l-[var(--p-cor)] bg-card p-3 flex flex-col gap-1.5"
                      style={{ '--p-cor': prioridadeCor ?? 'transparent' }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{task.titulo}</p>
                        <span className="text-xs font-medium bg-muted rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                          {index + 1}
                        </span>
                      </div>
                      {task.descricao && (
                        <p className="text-xs text-muted-foreground leading-snug">{task.descricao}</p>
                      )}
                      {prioridadeNome && (
                        <div className="mt-auto pt-1 flex items-center gap-1.5">
                          {prioridadeCor && (
                            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prioridadeCor }} />
                          )}
                          <span className="text-xs text-muted-foreground">{prioridadeNome}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t gap-2 shrink-0">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
          </Button>

          {projeto.ativo ? (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleInativar}
              disabled={isInativando}
            >
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
