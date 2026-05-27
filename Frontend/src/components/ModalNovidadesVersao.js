'use client';

import { Sparkles, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/base/dialog';
import { Button } from './ui/base/button';
import { CHANGELOG } from '../versao';

function BadgeVersao({ versao, atual }) {
  return (
    <span
      className={`inline-block text-xs font-mono px-2 py-0.5 rounded-full border ${
        atual
          ? 'bg-brand-blue/10 border-brand-blue/30 text-brand-blue'
          : 'bg-gray-100 border-gray-200 text-gray-500'
      }`}
    >
      v{versao}
    </span>
  );
}

export default function ModalNovidadesVersao({ aberto, aoFechar, versaoAtual }) {
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent aria-describedby={undefined} className="max-w-lg max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-blue" />
            <DialogTitle className="text-lg">Novidades do sistema</DialogTitle>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Versão atual: <span className="font-mono font-semibold text-gray-700">v{versaoAtual}</span>
          </p>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {CHANGELOG.map((entrada, idx) => {
            const eAtual = entrada.versao === versaoAtual;

            return (
              <div key={entrada.versao} className={`relative pl-4 ${idx < CHANGELOG.length - 1 ? 'pb-6 border-b border-gray-100' : ''}`}>
                <div className={`absolute left-0 top-1 h-3 w-3 rounded-full border-2 ${eAtual ? 'bg-brand-blue border-brand-blue' : 'bg-gray-200 border-gray-300'}`} />

                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <BadgeVersao versao={entrada.versao} atual={eAtual} />
                    <span className="text-xs text-gray-400">
                      {new Date(entrada.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  {eAtual && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      atual
                    </span>
                  )}
                </div>

                <h3 className="mt-2 font-semibold text-gray-800 text-sm">{entrada.titulo}</h3>

                <ul className="mt-2 space-y-1">
                  {entrada.mudancas.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
          <Button type="button" onClick={aoFechar}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
