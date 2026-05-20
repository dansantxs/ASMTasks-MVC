'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../../components/ui/base/dialog';
import { Input } from '../../../../components/ui/form/input';
import { Button } from '../../../../components/ui/base/button';

function formatarDocumento(documento, tipoPessoa) {
  if (!documento) return '';
  const d = documento.replace(/\D/g, '');
  if (tipoPessoa === 'J' && d.length === 14)
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (tipoPessoa === 'F' && d.length === 11)
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return documento;
}

export default function ModalBuscaMatriz({ open, onOpenChange, onSelect, matrizes = [], clienteIdAtual = null }) {
  const [termo, setTermo] = useState('');

  const candidatas = useMemo(
    () => matrizes.filter((m) => m.id !== clienteIdAtual),
    [matrizes, clienteIdAtual]
  );

  const filtradas = useMemo(() => {
    const t = termo.trim().toLowerCase();
    if (!t) return candidatas;
    return candidatas.filter((c) => {
      const nome = (c.nomeFantasia || c.nome || '').toLowerCase();
      const razao = (c.nome || '').toLowerCase();
      const doc = (c.documento || '').replace(/\D/g, '');
      return nome.includes(t) || razao.includes(t) || doc.includes(t);
    });
  }, [candidatas, termo]);

  const handleSelecionar = (matriz) => {
    onSelect(matriz);
    onOpenChange(false);
    setTermo('');
  };

  const handleOpenChange = (v) => {
    if (!v) setTermo('');
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Matriz</DialogTitle>
          <DialogDescription>
            Busque pelo nome ou CNPJ/CPF da empresa matriz. Apenas clientes que não são filiais podem ser selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar matriz..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-y-auto flex-1 border rounded-md divide-y">
          {filtradas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {termo ? 'Nenhuma matriz encontrada.' : 'Nenhum cliente disponível para ser matriz.'}
            </p>
          )}
          {filtradas.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleSelecionar(m)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
            >
              <p className="font-medium text-sm">{m.nomeFantasia || m.nome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatarDocumento(m.documento, m.tipoPessoa)}
                {m.cidade && ` · ${m.cidade}${m.uf ? `/${m.uf}` : ''}`}
              </p>
              {m.nomeFantasia && (
                <p className="text-xs text-muted-foreground">Razão Social: {m.nome}</p>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
