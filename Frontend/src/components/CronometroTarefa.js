'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PictureInPicture2, Pause, X } from 'lucide-react';
import { toast } from 'sonner';
import { pausarTarefa } from '../app/projetos/kanban/api/kanban';
import { useTarefaEmAndamento } from '../hooks/useTarefaEmAndamento';

function formatarDuracao(segundos) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  const par = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${par(h)}:${par(m)}:${par(s)}` : `${par(m)}:${par(s)}`;
}

function useCronometro(dataHoraInicio) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!dataHoraInicio) return;
    const inicioMs = new Date(dataHoraInicio).getTime();
    const atualizar = () => setSegundos(Math.max(0, Math.floor((Date.now() - inicioMs) / 1000)));
    atualizar();
    const intervalo = setInterval(atualizar, 1000);
    return () => clearInterval(intervalo);
  }, [dataHoraInicio]);

  return segundos;
}

// Conteúdo usado dentro da janela Picture-in-Picture — estilos inline pois o
// documento da PiP não herda o CSS/Tailwind da página principal.
function ConteudoPip({
  tarefa,
  tempoFormatado,
  formPausaAberto,
  observacao,
  onObservacaoChange,
  onIniciarPausa,
  onCancelarPausa,
  onConfirmarPausa,
  isPausando,
}) {
  return (
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        height: '100vh',
        boxSizing: 'border-box',
        padding: 14,
        margin: 0,
        background: '#0f172a',
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ height: 8, width: 8, borderRadius: 9999, background: '#22c55e', flexShrink: 0 }} />
        <span style={{ fontSize: 12, opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tarefa.projetoTitulo}
        </span>
      </div>
      <p
        style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={tarefa.titulo}
      >
        {tarefa.titulo}
      </p>
      <p style={{ fontSize: 30, fontWeight: 700, margin: '2px 0 8px', fontVariantNumeric: 'tabular-nums' }}>
        {tempoFormatado}
      </p>

      {formPausaAberto ? (
        <>
          <textarea
            autoFocus
            value={observacao}
            onChange={(e) => onObservacaoChange(e.target.value)}
            placeholder="Motivo da pausa (opcional)"
            maxLength={500}
            style={{
              flex: 1,
              minHeight: 50,
              resize: 'none',
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: 8,
              fontSize: 12,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onCancelarPausa}
              disabled={isPausando}
              style={{
                flex: 1,
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 600,
                cursor: isPausando ? 'default' : 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmarPausa}
              disabled={isPausando}
              style={{
                flex: 1,
                background: '#f97316',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 13,
                fontWeight: 600,
                cursor: isPausando ? 'default' : 'pointer',
                opacity: isPausando ? 0.6 : 1,
              }}
            >
              {isPausando ? 'Pausando...' : 'Confirmar'}
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={onIniciarPausa}
          style={{
            background: '#f97316',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '9px 10px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Pausar tarefa
        </button>
      )}
    </div>
  );
}

export default function CronometroTarefa({ enabled = true }) {
  const { tarefa } = useTarefaEmAndamento({ enabled });
  const segundos = useCronometro(tarefa?.dataHoraInicio);
  const tempoFormatado = formatarDuracao(segundos);
  const queryClient = useQueryClient();

  const [minimizado, setMinimizado] = useState(false);
  const [pipWindow, setPipWindow] = useState(null);
  const [formPausaAberto, setFormPausaAberto] = useState(false);
  const [observacao, setObservacao] = useState('');
  const pipSuportado = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  // Se a tarefa em andamento mudar (nova tarefa iniciada), descarta um formulário de pausa pendente.
  useEffect(() => {
    setFormPausaAberto(false);
    setObservacao('');
  }, [tarefa?.id]);

  const pausar = useMutation({
    mutationFn: () => pausarTarefa(tarefa.id, observacao.trim() || null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarefa-em-andamento'] });
      queryClient.invalidateQueries({ queryKey: ['kanban-tarefas'] });
      toast.success('Tarefa pausada.');
      setFormPausaAberto(false);
      setObservacao('');
      pipWindow?.close();
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao pausar tarefa.'),
  });

  const cancelarPausa = useCallback(() => {
    setFormPausaAberto(false);
    setObservacao('');
  }, []);

  const abrirPip = useCallback(async () => {
    if (!pipSuportado) return;
    try {
      const pip = await window.documentPictureInPicture.requestWindow({ width: 280, height: 230 });
      pip.document.title = 'Cronômetro - ASM Tasks';
      pip.document.body.style.margin = '0';
      pip.addEventListener('pagehide', () => setPipWindow(null), { once: true });
      setPipWindow(pip);
    } catch {
      toast.error('Não foi possível abrir a janela flutuante.');
    }
  }, [pipSuportado]);

  // Fecha a PiP se a tarefa for pausada por outra via (ex.: outra aba) enquanto flutuando.
  useEffect(() => {
    if (!tarefa && pipWindow) pipWindow.close();
  }, [tarefa, pipWindow]);

  useEffect(() => () => pipWindow?.close(), [pipWindow]);

  if (!tarefa) return null;

  if (pipWindow) {
    return createPortal(
      <ConteudoPip
        tarefa={tarefa}
        tempoFormatado={tempoFormatado}
        formPausaAberto={formPausaAberto}
        observacao={observacao}
        onObservacaoChange={setObservacao}
        onIniciarPausa={() => setFormPausaAberto(true)}
        onCancelarPausa={cancelarPausa}
        onConfirmarPausa={() => pausar.mutate()}
        isPausando={pausar.isPending}
      />,
      pipWindow.document.body
    );
  }

  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-[#0f172a] text-white px-4 py-2 shadow-lg hover:bg-[#1e293b] transition-colors"
      >
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <span className="text-sm font-mono tabular-nums">{tempoFormatado}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-xl bg-[#0f172a] text-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
          <span className="text-xs text-gray-400 truncate">{tarefa.projetoTitulo}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {pipSuportado && (
            <button
              onClick={abrirPip}
              title="Abrir em janela flutuante"
              className="p-1 rounded hover:bg-white/10 text-gray-300"
            >
              <PictureInPicture2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setMinimizado(true)}
            title="Minimizar"
            className="p-1 rounded hover:bg-white/10 text-gray-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate mb-1" title={tarefa.titulo}>
          {tarefa.titulo}
        </p>
        <p className="text-2xl font-bold font-mono tabular-nums mb-3">{tempoFormatado}</p>

        {formPausaAberto ? (
          <div className="space-y-2">
            <textarea
              autoFocus
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Motivo da pausa (opcional)"
              maxLength={500}
              rows={2}
              className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-2.5 py-2 text-xs text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <div className="flex gap-2">
              <button
                onClick={cancelarPausa}
                disabled={pausar.isPending}
                className="flex-1 border border-gray-600 text-gray-300 hover:bg-white/5 disabled:opacity-60 text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => pausar.mutate()}
                disabled={pausar.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                <Pause className="h-3.5 w-3.5" />
                {pausar.isPending ? 'Pausando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFormPausaAberto(true)}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg py-2 transition-colors"
          >
            <Pause className="h-3.5 w-3.5" />
            Pausar tarefa
          </button>
        )}
      </div>
    </div>
  );
}
