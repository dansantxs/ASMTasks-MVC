'use client';

import { Badge } from '../../../../ui/base/badge';
import { Card, CardContent } from '../../../../ui/layout/card';
import { CalendarDays, Clock3 } from 'lucide-react';

function formatWeekday(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
}

function formatDay(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatHour(date) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function overlapsDay(appointment, day) {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  const start = appointment.dataHoraInicio;
  const end = appointment.dataHoraFim ?? appointment.dataHoraInicio;

  return start <= dayEnd && end >= dayStart;
}

export default function AppointmentCalendar({ days, appointments, onSelectAppointment }) {
  const byDay = days.map((day) =>
    appointments
      .filter((a) => overlapsDay(a, day))
      .sort((a, b) => a.dataHoraInicio - b.dataHoraInicio)
  );

  const totalAgendados = appointments.filter((a) => a.status === 'A' && a.ativo).length;
  const totalRealizados = appointments.filter((a) => a.status === 'R' && a.ativo).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-600 hover:bg-emerald-700">Agendados: {totalAgendados}</Badge>
        <Badge variant="outline" className="border-slate-500 text-slate-700">
          Realizados: {totalRealizados}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {days.map((day, index) => (
          <Card key={day.toISOString()} className="min-h-[300px] border-t-4 border-t-brand-blue/30">
            <CardContent className="p-4">
              <div className="mb-3 border-b pb-3">
                <p className="text-xs uppercase text-muted-foreground">{formatWeekday(day)}</p>
                <p className="font-semibold">{formatDay(day)}</p>
              </div>

              <div className="space-y-2">
                {byDay[index].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectAppointment?.(item)}
                    className={`rounded-md border p-2 text-sm ${
                      item.status === 'R'
                        ? 'bg-slate-100 border-slate-300'
                        : 'bg-emerald-50 border-emerald-200'
                    } w-full text-left transition-colors hover:bg-accent`}
                  >
                    <p className="font-medium leading-tight">{item.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock3 className="h-3 w-3" />
                      {formatHour(item.dataHoraInicio)}
                      {item.dataHoraFim ? ` - ${formatHour(item.dataHoraFim)}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliente: {item.clienteNome ?? `#${item.clienteId}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Colaboradores: {item.colaboradoresNomes.join(', ') || '-'}
                    </p>
                  </button>
                ))}

                {byDay[index].length === 0 && (
                  <div className="h-24 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                    <div className="text-center">
                      <CalendarDays className="h-4 w-4 mx-auto mb-1" />
                      Sem atendimento
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
