'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../ui/form/select';
import { Plus, Trash2 } from 'lucide-react';
import { parseTimeToMinutes } from '../../../../shared/system-settings/utils';

function toDateTimeLocalValue(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function minutesToNotificationConfig(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return { valor: '', unidade: 'minutos' };
  }

  if (minutes % 1440 === 0) {
    return { valor: String(minutes / 1440), unidade: 'dias' };
  }

  if (minutes % 60 === 0) {
    return { valor: String(minutes / 60), unidade: 'horas' };
  }

  return { valor: String(minutes), unidade: 'minutos' };
}

function notificationConfigToMinutes(config) {
  const valor = Number(config?.valor ?? 0);
  if (!Number.isFinite(valor) || valor <= 0) return 0;

  if (config.unidade === 'dias') return valor * 1440;
  if (config.unidade === 'horas') return valor * 60;
  return valor;
}

export default function AppointmentForm({
  open,
  onOpenChange,
  clientes,
  colaboradores,
  appointment,
  colaboradorLogadoNome,
  agendaStartTime,
  agendaEndTime,
  onSave,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    colaboradoresIds: [],
    notificacoesMinutosAntecedencia: [],
  });
  const [errors, setErrors] = useState({});
  const [notificationConfigs, setNotificationConfigs] = useState([]);

  const colaboradoresAtivos = useMemo(
    () =>
      colaboradores
        .filter((c) => c.ativo)
        .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR', { sensitivity: 'base' })),
    [colaboradores]
  );

  const clientesAtivos = useMemo(
    () => clientes.filter((c) => c.ativo),
    [clientes]
  );

  useEffect(() => {
    if (!open) return;

    if (appointment) {
      setFormData({
        titulo: appointment.titulo ?? '',
        descricao: appointment.descricao ?? '',
        clienteId: appointment.clienteId ? String(appointment.clienteId) : '',
        dataHoraInicio: appointment.dataHoraInicio
          ? toDateTimeLocalValue(appointment.dataHoraInicio)
          : '',
        dataHoraFim: appointment.dataHoraFim ? toDateTimeLocalValue(appointment.dataHoraFim) : '',
        colaboradoresIds: appointment.colaboradoresIds ?? [],
        notificacoesMinutosAntecedencia: appointment.notificacoesMinutosAntecedencia ?? [],
      });
      setNotificationConfigs(
        (appointment.notificacoesMinutosAntecedencia ?? []).map(minutesToNotificationConfig)
      );
      setErrors({});
      return;
    }

    const base = new Date();
    const startMinutes = parseTimeToMinutes(agendaStartTime, 480);
    const endMinutes = parseTimeToMinutes(agendaEndTime, 1080);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const latestStartMinutes = Math.max(startMinutes, endMinutes - 60);

    if (currentMinutes > latestStartMinutes) {
      base.setDate(base.getDate() + 1);
      base.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    } else {
      const nextSlotMinutes = Math.max(startMinutes, Math.ceil(currentMinutes / 60) * 60);
      base.setHours(Math.floor(nextSlotMinutes / 60), nextSlotMinutes % 60, 0, 0);
    }
    const fim = new Date(base);
    fim.setHours(fim.getHours() + 1);

    setFormData({
      titulo: '',
      descricao: '',
      clienteId: '',
      dataHoraInicio: toDateTimeLocalValue(base),
      dataHoraFim: toDateTimeLocalValue(fim),
      colaboradoresIds: [],
      notificacoesMinutosAntecedencia: [],
    });
    setNotificationConfigs([]);
    setErrors({});
  }, [open, appointment, agendaEndTime, agendaStartTime]);

  const isWithinAgenda = (dateValue) => {
    if (!dateValue) return true;
    const date = new Date(dateValue);
    const minutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = parseTimeToMinutes(agendaStartTime, 480);
    const endMinutes = parseTimeToMinutes(agendaEndTime, 1080);
    return minutes >= startMinutes && minutes <= endMinutes;
  };

  const toggleColaborador = (id) => {
    setFormData((prev) => {
      const already = prev.colaboradoresIds.includes(id);
      return {
        ...prev,
        colaboradoresIds: already
          ? prev.colaboradoresIds.filter((item) => item !== id)
          : [...prev.colaboradoresIds, id],
      };
    });
  };

  const addNotificationConfig = () => {
    setNotificationConfigs((prev) => [...prev, { valor: '', unidade: 'minutos' }]);
  };

  const updateNotificationConfig = (index, patch) => {
    setNotificationConfigs((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeNotificationConfig = (index) => {
    setNotificationConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.titulo.trim()) nextErrors.titulo = 'Título é obrigatório.';
    if (!formData.clienteId) nextErrors.clienteId = 'Selecione um cliente.';
    if (!formData.dataHoraInicio) nextErrors.dataHoraInicio = 'Data/hora de início é obrigatória.';
    if (
      formData.dataHoraFim &&
      formData.dataHoraInicio &&
      new Date(formData.dataHoraFim) <= new Date(formData.dataHoraInicio)
    ) {
      nextErrors.dataHoraFim = 'Data/hora final deve ser maior que a inicial.';
    }
    if (formData.dataHoraInicio && !isWithinAgenda(formData.dataHoraInicio)) {
      nextErrors.dataHoraInicio = `O início deve estar entre ${agendaStartTime} e ${agendaEndTime}.`;
    }
    if (formData.dataHoraFim && !isWithinAgenda(formData.dataHoraFim)) {
      nextErrors.dataHoraFim = `O fim deve estar entre ${agendaStartTime} e ${agendaEndTime}.`;
    }
    if (formData.colaboradoresIds.length === 0) {
      nextErrors.colaboradoresIds = 'Selecione ao menos um colaborador para o atendimento.';
    }

    const notificationsInMinutes = notificationConfigs.map(notificationConfigToMinutes);
    const hasInvalidNotification = notificationsInMinutes.some((minutes) => minutes <= 0);
    const hasDuplicateNotifications = new Set(notificationsInMinutes).size !== notificationsInMinutes.length;

    if (hasInvalidNotification) {
      nextErrors.notificacoesMinutosAntecedencia =
        'Cada notificação deve ter valor inteiro maior que zero.';
    } else if (hasDuplicateNotifications) {
      nextErrors.notificacoesMinutosAntecedencia = 'Não repita notificações com o mesmo tempo.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim() || null,
      clienteId: Number(formData.clienteId),
      dataHoraInicio: formData.dataHoraInicio,
      dataHoraFim: formData.dataHoraFim || null,
      colaboradoresIds: formData.colaboradoresIds.map(Number),
      notificacoesMinutosAntecedencia: notificationConfigs.map(notificationConfigToMinutes),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{appointment ? 'Alterar Atendimento' : 'Novo Atendimento'}</DialogTitle>
          <DialogDescription>
            {appointment
              ? 'Ajuste os dados do atendimento selecionado.'
              : 'Preencha os dados para agendar o atendimento no calend?rio.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex.: Atendimento comercial"
                className={errors.titulo ? 'border-destructive' : ''}
              />
              {errors.titulo && <p className="text-sm text-destructive">{errors.titulo}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Observações do atendimento"
              />
            </div>

            <div>
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger className={errors.clienteId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientesAtivos.map((cliente) => (
                    <SelectItem key={cliente.id} value={String(cliente.id)}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clienteId && <p className="text-sm text-destructive">{errors.clienteId}</p>}
            </div>

            <div>
              <Label>Cadastrado por</Label>
              <Input value={colaboradorLogadoNome || '-'} disabled />
            </div>

            <div>
              <Label htmlFor="dataHoraInicio">Data/hora início <span className="text-destructive">*</span></Label>
              <Input
                id="dataHoraInicio"
                type="datetime-local"
                value={formData.dataHoraInicio}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataHoraInicio: e.target.value }))}
                className={errors.dataHoraInicio ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Horário permitido: {agendaStartTime} até {agendaEndTime}
              </p>
              {errors.dataHoraInicio && (
                <p className="text-sm text-destructive">{errors.dataHoraInicio}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataHoraFim">Data/hora fim</Label>
              <Input
                id="dataHoraFim"
                type="datetime-local"
                value={formData.dataHoraFim}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataHoraFim: e.target.value }))}
                className={errors.dataHoraFim ? 'border-destructive' : ''}
              />
              {errors.dataHoraFim && <p className="text-sm text-destructive">{errors.dataHoraFim}</p>}
            </div>
          </div>

          <div>
            <Label>Colaboradores do atendimento <span className="text-destructive">*</span></Label>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
              {colaboradoresAtivos.map((colaborador) => (
                <label
                  key={colaborador.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.colaboradoresIds.includes(colaborador.id)}
                    onChange={() => toggleColaborador(colaborador.id)}
                  />
                  <span className="text-sm">{colaborador.nome}</span>
                </label>
              ))}
              {colaboradoresAtivos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum colaborador ativo disponível.</p>
              )}
            </div>
            {errors.colaboradoresIds && (
              <p className="text-sm text-destructive mt-1">{errors.colaboradoresIds}</p>
            )}
          </div>

          <div>
            <Label>Notificações antes do atendimento</Label>
            <div className="mt-2 rounded-md border p-3 space-y-3">
              {notificationConfigs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação configurada.
                </p>
              )}

              {notificationConfigs.map((config, index) => (
                <div key={`notification-${index}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={config.valor}
                    onChange={(e) => updateNotificationConfig(index, { valor: e.target.value })}
                    placeholder="Valor"
                  />

                  <Select
                    value={config.unidade}
                    onValueChange={(value) => updateNotificationConfig(index, { unidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos antes</SelectItem>
                      <SelectItem value="horas">Horas antes</SelectItem>
                      <SelectItem value="dias">Dias antes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeNotificationConfig(index)}
                    className="w-full md:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addNotificationConfig}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar notificação
              </Button>
            </div>
            {errors.notificacoesMinutosAntecedencia && (
              <p className="text-sm text-destructive mt-1">
                {errors.notificacoesMinutosAntecedencia}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={isSaving}>
              {isSaving ? 'Salvando...' : appointment ? 'Salvar alterações' : 'Agendar Atendimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
