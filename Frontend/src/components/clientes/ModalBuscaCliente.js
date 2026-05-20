'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/base/dialog';
import { Input } from '../ui/form/input';
import { Button } from '../ui/base/button';
import { getClientesMatrizes } from '../../app/cadastros/clientes/api/cliente';

function resolverNome(cliente, exibicao) {
  if (exibicao === 'nomeFantasia' && cliente.nomeFantasia) return cliente.nomeFantasia;
  return cliente.nome;
}

function formatarDocumento(documento, tipoPessoa) {
  if (!documento) return '';
  const d = documento.replace(/\D/g, '');
  if (tipoPessoa === 'J' && d.length === 14)
    return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (tipoPessoa === 'F' && d.length === 11)
    return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return documento;
}

export default function ModalBuscaCliente({ open, onOpenChange, onSelect, exibicaoNomeCliente = 'razaoSocial' }) {
  const [termo, setTermo] = useState('');

  const { data: matrizes = [], isLoading } = useQuery({
    queryKey: ['clientes-matrizes'],
    queryFn: getClientesMatrizes,
    enabled: open,
    staleTime: 2 * 60 * 1000,
  });

  const filtradas = useMemo(() => {
    const t = termo.trim().toLowerCase();
    if (!t) return matrizes;
    return matrizes.filter((c) => {
      const nome = resolverNome(c, exibicaoNomeCliente).toLowerCase();
      const razao = (c.nome ?? '').toLowerCase();
      const doc = (c.documento ?? '').replace(/\D/g, '');
      return nome.includes(t) || razao.includes(t) || doc.includes(t);
    });
  }, [matrizes, termo, exibicaoNomeCliente]);

  const handleSelecionar = (cliente) => {
    onSelect(cliente);
    onOpenChange(false);
    setTermo('');
  };

  const handleOpenChange = (v) => {
    if (!v) setTermo('');
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Cliente</DialogTitle>
          <DialogDescription>
            Pesquise por nome, razão social, nome fantasia ou CNPJ/CPF. Apenas clientes matriz são exibidos.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Buscar..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-y-auto flex-1 border rounded-md divide-y">
          {isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
          )}
          {!isLoading && filtradas.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {termo ? 'Nenhum cliente encontrado.' : 'Nenhum cliente matriz cadastrado.'}
            </p>
          )}
          {filtradas.map((cliente) => (
            <button
              key={cliente.id}
              type="button"
              onClick={() => handleSelecionar(cliente)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors focus:outline-none focus:bg-muted/50"
            >
              <p className="font-medium text-sm">{resolverNome(cliente, exibicaoNomeCliente)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatarDocumento(cliente.documento, cliente.tipoPessoa)}
                {cliente.cidade && ` · ${cliente.cidade}${cliente.uf ? `/${cliente.uf}` : ''}`}
              </p>
              {exibicaoNomeCliente === 'nomeFantasia' && cliente.nomeFantasia && (
                <p className="text-xs text-muted-foreground">Razão Social: {cliente.nome}</p>
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
