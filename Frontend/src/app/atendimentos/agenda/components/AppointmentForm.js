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

function toDateTimeLocalValue(date) {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

export default function AppointmentForm({
  open,
  onOpenChange,
  clientes,
  colaboradores,
  appointment,
  onSave,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    cadastradoPorColaboradorId: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    colaboradoresIds: [],
  });
  const [errors, setErrors] = useState({});

  const colaboradoresAtivos = useMemo(
    () => colaboradores.filter((c) => c.ativo),
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
        cadastradoPorColaboradorId: appointment.cadastradoPorColaboradorId
          ? String(appointment.cadastradoPorColaboradorId)
          : '',
        dataHoraInicio: appointment.dataHoraInicio
          ? toDateTimeLocalValue(appointment.dataHoraInicio)
          : '',
        dataHoraFim: appointment.dataHoraFim ? toDateTimeLocalValue(appointment.dataHoraFim) : '',
        colaboradoresIds: appointment.colaboradoresIds ?? [],
      });
      setErrors({});
      return;
    }

    const base = new Date();
    base.setMinutes(0, 0, 0);
    base.setHours(base.getHours() + 1);
    const fim = new Date(base);
    fim.setHours(fim.getHours() + 1);

    setFormData({
      titulo: '',
      descricao: '',
      clienteId: '',
      cadastradoPorColaboradorId: '',
      dataHoraInicio: toDateTimeLocalValue(base),
      dataHoraFim: toDateTimeLocalValue(fim),
      colaboradoresIds: [],
    });
    setErrors({});
  }, [open, appointment]);

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

  const validate = () => {
    const nextErrors = {};

    if (!formData.titulo.trim()) nextErrors.titulo = 'Titulo e obrigatorio.';
    if (!formData.clienteId) nextErrors.clienteId = 'Selecione um cliente.';
    if (!formData.cadastradoPorColaboradorId) {
      nextErrors.cadastradoPorColaboradorId = 'Selecione quem esta cadastrando.';
    }
    if (!formData.dataHoraInicio) nextErrors.dataHoraInicio = 'Data/hora de inicio e obrigatoria.';
    if (
      formData.dataHoraFim &&
      formData.dataHoraInicio &&
      new Date(formData.dataHoraFim) <= new Date(formData.dataHoraInicio)
    ) {
      nextErrors.dataHoraFim = 'Data/hora final deve ser maior que a inicial.';
    }
    if (formData.colaboradoresIds.length === 0) {
      nextErrors.colaboradoresIds = 'Selecione ao menos um colaborador para o atendimento.';
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
      cadastradoPorColaboradorId: Number(formData.cadastradoPorColaboradorId),
      dataHoraInicio: formData.dataHoraInicio,
      dataHoraFim: formData.dataHoraFim || null,
      colaboradoresIds: formData.colaboradoresIds.map(Number),
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
              : 'Preencha os dados para agendar o atendimento no calendario.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="titulo">Titulo <span className="text-destructive">*</span></Label>
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
              <Label htmlFor="descricao">Descricao</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Observacoes do atendimento (opcional)"
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
              <Label>Colaborador que cadastra <span className="text-destructive">*</span></Label>
              <Select
                value={formData.cadastradoPorColaboradorId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, cadastradoPorColaboradorId: value }))
                }
              >
                <SelectTrigger className={errors.cadastradoPorColaboradorId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradoresAtivos.map((colaborador) => (
                    <SelectItem key={colaborador.id} value={String(colaborador.id)}>
                      {colaborador.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cadastradoPorColaboradorId && (
                <p className="text-sm text-destructive">{errors.cadastradoPorColaboradorId}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataHoraInicio">Data/hora inicio <span className="text-destructive">*</span></Label>
              <Input
                id="dataHoraInicio"
                type="datetime-local"
                value={formData.dataHoraInicio}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataHoraInicio: e.target.value }))}
                className={errors.dataHoraInicio ? 'border-destructive' : ''}
              />
              {errors.dataHoraInicio && (
                <p className="text-sm text-destructive">{errors.dataHoraInicio}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataHoraFim">Data/hora fim (opcional)</Label>
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
                <p className="text-sm text-muted-foreground">Nenhum colaborador ativo disponivel.</p>
              )}
            </div>
            {errors.colaboradoresIds && (
              <p className="text-sm text-destructive mt-1">{errors.colaboradoresIds}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={isSaving}>
              {isSaving ? 'Salvando...' : appointment ? 'Salvar alteracoes' : 'Agendar Atendimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
