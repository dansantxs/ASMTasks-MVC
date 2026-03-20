'use client';

import { Badge } from '../../../ui/base/badge';
import { CalendarDays, Clock3 } from 'lucide-react';
import { converterHoraParaMinutos } from '../../../shared/configuracoes-sistema/utils';

const PIXELS_POR_MINUTO = 1.2;
const MINUTOS_MIN_ATENDIMENTO = 60;
const MINUTOS_SLOT = 60;

function formatarDiaSemana(data) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(data);
}

function formatarDia(data) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(data);
}

function formatarHora(data) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
}

function obterInicioGrade(dia, minutosInicio) {
  const inicio = new Date(dia);
  inicio.setHours(Math.floor(minutosInicio / 60), minutosInicio % 60, 0, 0);
  return inicio;
}

function obterFimGrade(dia, minutosFim) {
  const fim = new Date(dia);
  fim.setHours(Math.floor(minutosFim / 60), minutosFim % 60, 0, 0);
  return fim;
}

function obterIntervaloExibicao(atendimento) {
  const inicio = atendimento.dataHoraInicio;
  const fim = atendimento.dataHoraFim ?? new Date(inicio.getTime() + MINUTOS_MIN_ATENDIMENTO * 60 * 1000);
  return { inicio, fim };
}

function construirEntradasDia(dia, atendimentos, minutosInicio, minutosFim) {
  const inicioGrade = obterInicioGrade(dia, minutosInicio);
  const fimGrade = obterFimGrade(dia, minutosFim);
  const totalMinutos = minutosFim - minutosInicio;

  const cortados = atendimentos
    .map((item) => {
      const intervalo = obterIntervaloExibicao(item);
      const inicioVisivel = new Date(Math.max(intervalo.inicio.getTime(), inicioGrade.getTime()));
      const fimVisivel = new Date(Math.min(intervalo.fim.getTime(), fimGrade.getTime()));

      if (fimVisivel <= inicioGrade || inicioVisivel >= fimGrade) return null;

      const minInicio = (inicioVisivel.getTime() - inicioGrade.getTime()) / 60000;
      const minFim = (fimVisivel.getTime() - inicioGrade.getTime()) / 60000;
      const duracao = Math.max(MINUTOS_MIN_ATENDIMENTO, minFim - minInicio);
      const fimLimitado = Math.min(totalMinutos, minInicio + duracao);

      return {
        item,
        minInicio,
        minFim: fimLimitado,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.minInicio - b.minInicio);

  const ativos = [];
  const faixasLivres = [];
  let maxFaixa = 0;

  for (const entrada of cortados) {
    for (let i = ativos.length - 1; i >= 0; i -= 1) {
      if (ativos[i].minFim <= entrada.minInicio) {
        faixasLivres.push(ativos[i].faixa);
        ativos.splice(i, 1);
      }
    }

    faixasLivres.sort((a, b) => a - b);
    const faixa = faixasLivres.length > 0 ? faixasLivres.shift() : maxFaixa++;
    entrada.faixa = faixa;
    ativos.push({ minFim: entrada.minFim, faixa });
  }

  return cortados.map((entrada) => ({
    ...entrada,
    totalFaixas: Math.max(1, maxFaixa),
  }));
}

export default function CalendarioAtendimentos({
  dias,
  atendimentos,
  horaInicioAgenda,
  horaFimAgenda,
  aoSelecionarAtendimento,
}) {
  const totalAgendados = atendimentos.filter((a) => a.status === 'A').length;
  const totalRealizados = atendimentos.filter((a) => a.status === 'R').length;
  const minutosInicio = converterHoraParaMinutos(horaInicioAgenda, 480);
  const minutosFim = converterHoraParaMinutos(horaFimAgenda, 1080);
  const minutosFimSeguro = minutosFim > minutosInicio ? minutosFim : minutosInicio + 60;
  const totalMinutos = minutosFimSeguro - minutosInicio;
  const alturaGrade = totalMinutos * PIXELS_POR_MINUTO;

  const porDia = dias.map((dia) => {
    const inicioDia = new Date(dia);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dia);
    fimDia.setHours(23, 59, 59, 999);

    const atendimentosDia = atendimentos.filter((atendimento) => {
      const { inicio, fim } = obterIntervaloExibicao(atendimento);
      return inicio <= fimDia && fim >= inicioDia;
    });

    return construirEntradasDia(dia, atendimentosDia, minutosInicio, minutosFimSeguro);
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
            {dias.map((dia) => (
              <div key={`cabecalho-${dia.toISOString()}`} className="px-3 py-3 border-r last:border-r-0 bg-muted/20">
                <p className="text-xs uppercase text-muted-foreground">{formatarDiaSemana(dia)}</p>
                <p className="font-semibold">{formatarDia(dia)}</p>
              </div>
            ))}
          </div>

          <div className="grid" style={{ gridTemplateColumns: '72px repeat(7, minmax(140px, 1fr))' }}>
            <div className="relative border-r bg-muted/20" style={{ height: `${alturaGrade}px` }}>
              {Array.from({ length: Math.floor(totalMinutos / MINUTOS_SLOT) + 1 }, (_, i) => {
                const minutosDia = minutosInicio + i * MINUTOS_SLOT;
                const hora = Math.floor(minutosDia / 60);
                const minuto = minutosDia % 60;
                const rotulo = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
                const topo = i * MINUTOS_SLOT * PIXELS_POR_MINUTO;
                return (
                  <div key={`hora-${rotulo}`} className="absolute left-0 right-0" style={{ top: `${topo}px` }}>
                    <span className="-translate-y-1/2 inline-block px-2 text-[11px] text-muted-foreground">
                      {rotulo}
                    </span>
                  </div>
                );
              })}
            </div>

            {dias.map((dia, indice) => (
              <div key={`coluna-${dia.toISOString()}`} className="relative border-r last:border-r-0" style={{ height: `${alturaGrade}px` }}>
                {Array.from({ length: Math.floor(totalMinutos / MINUTOS_SLOT) + 1 }, (_, i) => {
                  const topo = i * MINUTOS_SLOT * PIXELS_POR_MINUTO;
                  return (
                    <div
                      key={`linha-${dia.toISOString()}-${i}`}
                      className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/20"
                      style={{ top: `${topo}px` }}
                    />
                  );
                })}

                {porDia[indice].length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                    <div className="text-center">
                      <CalendarDays className="h-4 w-4 mx-auto mb-1" />
                      Sem atendimento
                    </div>
                  </div>
                )}

                {porDia[indice].map(({ item, minInicio, minFim, faixa, totalFaixas }) => {
                  const espacamento = 1.5;
                  const largura = (100 - (totalFaixas - 1) * espacamento) / totalFaixas;
                  const esquerda = faixa * (largura + espacamento);
                  const topo = minInicio * PIXELS_POR_MINUTO;
                  const altura = Math.max(26, (minFim - minInicio) * PIXELS_POR_MINUTO);

                  return (
                    <button
                      key={`${dia.toISOString()}-${item.id}-${minInicio}`}
                      type="button"
                      onClick={() => aoSelecionarAtendimento?.(item)}
                      className={`absolute rounded-md border p-2 text-xs ${
                        item.status === 'R'
                          ? 'bg-slate-100 border-slate-300'
                          : 'bg-emerald-50 border-emerald-200'
                      } text-left transition-colors hover:bg-accent overflow-hidden`}
                      style={{
                        top: `${topo}px`,
                        left: `${esquerda}%`,
                        width: `${largura}%`,
                        height: `${altura}px`,
                      }}
                    >
                      <p className="font-medium leading-tight truncate">{item.titulo}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {formatarHora(item.dataHoraInicio)}
                        {item.dataHoraFim ? ` - ${formatarHora(item.dataHoraFim)}` : ''}
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
