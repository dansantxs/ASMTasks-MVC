'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Badge } from '../../../../ui/base/badge';

function formatDateTime(date) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatNotification(minutes) {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} dia${days > 1 ? 's' : ''} antes`;
  }

  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hora${hours > 1 ? 's' : ''} antes`;
  }

  return `${minutes} minutos antes`;
}

export default function AppointmentViewDialog({
  open,
  onOpenChange,
  appointment,
  onEdit,
  onToggleConclude,
  onDelete,
  isTogglingConclude,
  isDeleting,
}) {
  if (!appointment) return null;

  const isConcluded = appointment.status === 'R';
  const reminders = appointment.notificacoesMinutosAntecedencia ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{appointment.titulo}</DialogTitle>
          <DialogDescription>Visualizacao do atendimento selecionado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={isConcluded ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}>
              {isConcluded ? 'Concluido' : 'Agendado'}
            </Badge>
          </div>
          <p><span className="font-medium">Cliente:</span> {appointment.clienteNome ?? `#${appointment.clienteId}`}</p>
          <p><span className="font-medium">Inicio:</span> {formatDateTime(appointment.dataHoraInicio)}</p>
          <p><span className="font-medium">Fim:</span> {formatDateTime(appointment.dataHoraFim)}</p>
          <p><span className="font-medium">Colaboradores:</span> {appointment.colaboradoresNomes.join(', ') || '-'}</p>
          <p>
            <span className="font-medium">Notificacoes:</span>{' '}
            {reminders.length > 0 ? reminders.map(formatNotification).join(', ') : '-'}
          </p>
          <p><span className="font-medium">Descricao:</span> {appointment.descricao || '-'}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onDelete} disabled={isDeleting || isConcluded}>
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </Button>
          <Button type="button" variant="outline" onClick={onEdit} disabled={isConcluded}>
            Alterar
          </Button>
          <Button
            type="button"
            onClick={onToggleConclude}
            disabled={isTogglingConclude}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isTogglingConclude
              ? 'Atualizando...'
              : isConcluded
              ? 'Desmarcar concluido'
              : 'Marcar como concluido'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
