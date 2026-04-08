'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Search, X } from 'lucide-react';
import { Button } from '../../../ui/base/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/base/dialog';
import { Input } from '../../../ui/form/input';

function normalizarTexto(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function DialogoDuplicarProjeto({ open, onOpenChange, projeto, clientes, aoConfirmar, salvando }) {
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState(new Set());

  useEffect(() => {
    if (open) {
      setBusca('');
      setSelecionados(new Set());
    }
  }, [open]);

  const clientesAtivos = useMemo(
    () => clientes.filter((c) => c.ativo !== false),
    [clientes]
  );

  const clientesFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca.trim());
    if (!termo) return clientesAtivos;
    return clientesAtivos.filter((c) => normalizarTexto(c.nome).includes(termo));
  }, [clientesAtivos, busca]);

  if (!projeto) return null;

  const toggleCliente = (id) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    const idsFiltrados = clientesFiltrados.map((c) => c.id);
    const todosSelecionados = idsFiltrados.every((id) => selecionados.has(id));
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (todosSelecionados) idsFiltrados.forEach((id) => next.delete(id));
      else idsFiltrados.forEach((id) => next.add(id));
      return next;
    });
  };

  const todosFiltradosSelecionados =
    clientesFiltrados.length > 0 && clientesFiltrados.every((c) => selecionados.has(c.id));

  const handleConfirmar = () => {
    if (selecionados.size === 0) return;
    aoConfirmar(projeto.id, Array.from(selecionados));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-brand-blue shrink-0" />
            <DialogTitle>Duplicar projeto</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Será criado <span className="font-medium text-foreground">"{projeto.titulo}"</span> para cada cliente
            selecionado, com todas as tarefas no Backlog.
          </p>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 pr-9"
              placeholder="Buscar cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setBusca('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Cabeçalho da lista */}
          <div className="flex items-center justify-between px-1">
            <button
              className="text-xs text-brand-blue hover:underline"
              onClick={toggleTodos}
              disabled={clientesFiltrados.length === 0}
            >
              {todosFiltradosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}
              {busca ? ' (filtrados)' : ''}
            </button>
            {selecionados.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selecionados.size} selecionado{selecionados.size > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Lista de clientes */}
          <div className="border rounded-md overflow-y-auto max-h-64">
            {clientesFiltrados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente encontrado.</p>
            ) : (
              clientesFiltrados.map((cliente) => {
                const marcado = selecionados.has(cliente.id);
                return (
                  <button
                    key={cliente.id}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors border-b last:border-b-0 ${
                      marcado ? 'bg-brand-blue/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleCliente(cliente.id)}
                  >
                    <span
                      className={`shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                        marcado
                          ? 'bg-brand-blue border-brand-blue'
                          : 'border-muted-foreground/40 bg-background'
                      }`}
                    >
                      {marcado && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </span>
                    <span className={marcado ? 'font-medium' : ''}>{cliente.nome}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            className="bg-brand-blue hover:bg-brand-blue-dark"
            onClick={handleConfirmar}
            disabled={selecionados.size === 0 || salvando}
          >
            <Copy className="h-4 w-4 mr-1" />
            {salvando
              ? 'Duplicando...'
              : selecionados.size > 0
                ? `Duplicar para ${selecionados.size} cliente${selecionados.size > 1 ? 's' : ''}`
                : 'Duplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
