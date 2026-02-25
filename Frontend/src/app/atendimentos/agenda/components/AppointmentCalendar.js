'use client';

import { Badge } from '../../../../ui/base/badge';
import { CalendarDays, Clock3 } from 'lucide-react';

const GRID_START_HOUR = 0;
const GRID_END_HOUR = 24;
const PIXELS_PER_MINUTE = 1.2;
const MIN_APPOINTMENT_MINUTES = 60;
const SLOT_MINUTES = 60;

function formatWeekday(date) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
}

function formatDay(date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
}

function formatHour(date) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

function getGridStart(day) {
  const start = new Date(day);
  start.setHours(GRID_START_HOUR, 0, 0, 0);
  return start;
}

function getGridEnd(day) {
  const end = new Date(day);
  end.setHours(GRID_END_HOUR, 0, 0, 0);
  return end;
}

function getDisplayInterval(appointment) {
  const start = appointment.dataHoraInicio;
  const end = appointment.dataHoraFim ?? new Date(start.getTime() + MIN_APPOINTMENT_MINUTES * 60 * 1000);
  return { start, end };
}

function buildDayEntries(day, appointments) {
  const gridStart = getGridStart(day);
  const gridEnd = getGridEnd(day);

  const clipped = appointments
    .map((item) => {
      const interval = getDisplayInterval(item);
      const visibleStart = new Date(Math.max(interval.start.getTime(), gridStart.getTime()));
      const visibleEnd = new Date(Math.min(interval.end.getTime(), gridEnd.getTime()));

      if (visibleEnd <= gridStart || visibleStart >= gridEnd) return null;

      const startMin = (visibleStart.getTime() - gridStart.getTime()) / 60000;
      const endMin = (visibleEnd.getTime() - gridStart.getTime()) / 60000;
      const duration = Math.max(MIN_APPOINTMENT_MINUTES, endMin - startMin);
      const boundedEnd = Math.min((GRID_END_HOUR - GRID_START_HOUR) * 60, startMin + duration);

      return {
        item,
        startMin,
        endMin: boundedEnd,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.startMin - b.startMin);

  const active = [];
  const freeLanes = [];
  let maxLane = 0;

  for (const entry of clipped) {
    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].endMin <= entry.startMin) {
        freeLanes.push(active[i].lane);
        active.splice(i, 1);
      }
    }

    freeLanes.sort((a, b) => a - b);
    const lane = freeLanes.length > 0 ? freeLanes.shift() : maxLane++;
    entry.lane = lane;
    active.push({ endMin: entry.endMin, lane });
  }

  return clipped.map((entry) => ({
    ...entry,
    laneCount: Math.max(1, maxLane),
  }));
}

export default function AppointmentCalendar({ days, appointments, onSelectAppointment }) {
  const totalAgendados = appointments.filter((a) => a.status === 'A' && a.ativo).length;
  const totalRealizados = appointments.filter((a) => a.status === 'R' && a.ativo).length;
  const gridHeight = (GRID_END_HOUR - GRID_START_HOUR) * 60 * PIXELS_PER_MINUTE;

  const byDay = days.map((day) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAppointments = appointments.filter((appointment) => {
      const { start, end } = getDisplayInterval(appointment);
      return start <= dayEnd && end >= dayStart;
    });

    return buildDayEntries(day, dayAppointments);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-600 hover:bg-emerald-700">Agendados: {totalAgendados}</Badge>
        <Badge variant="outline" className="border-slate-500 text-slate-700">
          Realizados: {totalRealizados}
        </Badge>
      </div>

      <div className="rounded-lg border bg-card overflow-auto">
        <div className="min-w-[1100px]">
          <div className="grid border-b" style={{ gridTemplateColumns: '72px repeat(7, minmax(140px, 1fr))' }}>
            <div className="border-r bg-muted/30" />
            {days.map((day) => (
              <div key={`header-${day.toISOString()}`} className="px-3 py-3 border-r last:border-r-0 bg-muted/20">
                <p className="text-xs uppercase text-muted-foreground">{formatWeekday(day)}</p>
                <p className="font-semibold">{formatDay(day)}</p>
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: '72px repeat(7, minmax(140px, 1fr))' }}>
            <div className="relative border-r bg-muted/20" style={{ height: `${gridHeight}px` }}>
              {Array.from({ length: ((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES + 1 }, (_, i) => {
                const minuteOfDay = GRID_START_HOUR * 60 + i * SLOT_MINUTES;
                const hour = Math.floor(minuteOfDay / 60);
                const minute = minuteOfDay % 60;
                const label = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                const top = i * SLOT_MINUTES * PIXELS_PER_MINUTE;
                return (
                  <div key={`time-${label}`} className="absolute left-0 right-0" style={{ top: `${top}px` }}>
                    <span className="-translate-y-1/2 inline-block px-2 text-[11px] text-muted-foreground">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {days.map((day, index) => (
              <div key={`col-${day.toISOString()}`} className="relative border-r last:border-r-0" style={{ height: `${gridHeight}px` }}>
                {Array.from({ length: ((GRID_END_HOUR - GRID_START_HOUR) * 60) / SLOT_MINUTES + 1 }, (_, i) => {
                  const top = i * SLOT_MINUTES * PIXELS_PER_MINUTE;
                  return (
                    <div
                      key={`line-${day.toISOString()}-${i}`}
                      className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/20"
                      style={{ top: `${top}px` }}
                    />
                  );
                })}

                {byDay[index].length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                    <div className="text-center">
                      <CalendarDays className="h-4 w-4 mx-auto mb-1" />
                      Sem atendimento
                    </div>
                  </div>
                )}

                {byDay[index].map(({ item, startMin, endMin, lane, laneCount }) => {
                  const gap = 1.5;
                  const width = (100 - (laneCount - 1) * gap) / laneCount;
                  const left = lane * (width + gap);
                  const top = startMin * PIXELS_PER_MINUTE;
                  const height = Math.max(26, (endMin - startMin) * PIXELS_PER_MINUTE);

                  return (
                    <button
                      key={`${day.toISOString()}-${item.id}-${startMin}`}
                      type="button"
                      onClick={() => onSelectAppointment?.(item)}
                      className={`absolute rounded-md border p-2 text-xs ${
                        item.status === 'R'
                          ? 'bg-slate-100 border-slate-300'
                          : 'bg-emerald-50 border-emerald-200'
                      } text-left transition-colors hover:bg-accent overflow-hidden`}
                      style={{
                        top: `${top}px`,
                        left: `${left}%`,
                        width: `${width}%`,
                        height: `${height}px`,
                      }}
                    >
                      <p className="font-medium leading-tight truncate">{item.titulo}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatHour(item.dataHoraInicio)}
                        {item.dataHoraFim ? ` - ${formatHour(item.dataHoraFim)}` : ''}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-1">
                        Cliente: {item.clienteNome ?? `#${item.clienteId}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
