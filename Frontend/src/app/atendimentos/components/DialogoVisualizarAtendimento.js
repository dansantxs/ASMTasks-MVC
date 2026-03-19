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

function formatarDataHora(data) {
  if (!data) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(data);
}

function formatarNotificacao(minutos) {
  if (minutos % 1440 === 0) {
    const dias = minutos / 1440;
    return `${dias} dia${dias > 1 ? 's' : ''} antes`;
  }

  if (minutos % 60 === 0) {
    const horas = minutos / 60;
    return `${horas} hora${horas > 1 ? 's' : ''} antes`;
  }

  return `${minutos} minutos antes`;
}

export default function DialogoVisualizarAtendimento({
  open,
  onOpenChange,
  atendimento,
  aoEditar,
  aoAlternarConclusao,
  aoExcluir,
  alternandoConclusao,
  excluindo,
}) {
  if (!atendimento) return null;

  const concluido = atendimento.status === 'R';
  const lembretes = atendimento.notificacoesMinutosAntecedencia ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{atendimento.titulo}</DialogTitle>
          <DialogDescription>Visualização do atendimento selecionado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={concluido ? 'bg-slate-600 hover:bg-slate-700' : 'bg-emerald-600 hover:bg-emerald-700'}>
              {concluido ? 'Concluído' : 'Agendado'}
            </Badge>
          </div>
          <p><span className="font-medium">Cliente:</span> {atendimento.clienteNome ?? `#${atendimento.clienteId}`}</p>
          <p><span className="font-medium">Cadastrado por:</span> {atendimento.cadastradoPorNome ?? `#${atendimento.cadastradoPorColaboradorId}`}</p>
          <p><span className="font-medium">Início:</span> {formatarDataHora(atendimento.dataHoraInicio)}</p>
          <p><span className="font-medium">Fim:</span> {formatarDataHora(atendimento.dataHoraFim)}</p>
          <p><span className="font-medium">Colaboradores:</span> {atendimento.colaboradoresNomes.join(', ') || '-'}</p>
          <p>
            <span className="font-medium">Notificações:</span>{' '}
            {lembretes.length > 0 ? lembretes.map(formatarNotificacao).join(', ') : '-'}
          </p>
          <p><span className="font-medium">Descrição:</span> {atendimento.descricao || '-'}</p>
          <p><span className="font-medium">Concluído por:</span> {atendimento.concluidoPorNome ?? '-'}</p>
          <p><span className="font-medium">Data/hora da conclusão:</span> {formatarDataHora(atendimento.dataHoraConclusao)}</p>
          <p><span className="font-medium">Resumo da reunião:</span> {atendimento.observacaoConclusao || '-'}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={aoExcluir} disabled={excluindo || concluido}>
            {excluindo ? 'Excluindo...' : 'Excluir'}
          </Button>
          <Button type="button" variant="outline" onClick={aoEditar} disabled={concluido}>
            Alterar
          </Button>
          <Button
            type="button"
            onClick={aoAlternarConclusao}
            disabled={alternandoConclusao}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {alternandoConclusao
              ? 'Atualizando...'
              : concluido
              ? 'Desmarcar concluído'
              : 'Marcar como concluído'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
