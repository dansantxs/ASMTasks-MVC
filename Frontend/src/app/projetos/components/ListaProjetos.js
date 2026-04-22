'use client';

import { useMemo, useState } from 'react';
import { Badge } from '../../../ui/base/badge';
import { Button } from '../../../ui/base/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Input } from '../../../ui/form/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/layout/table';
import { Eye, FolderKanban, Search } from 'lucide-react';

function formatarDataHora(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizarTexto(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}


const ABAS = [
  { id: 'ativos', label: 'Ativos', badgeClass: 'border-brand-blue text-brand-blue' },
  { id: 'concluidos', label: 'Concluídos', badgeClass: 'border-green-600 text-green-700' },
  { id: 'inativos', label: 'Inativos', badgeClass: '' },
];

export default function ListaProjetos({
  projetos,
  clientesById,
  setoresById,
  etapasById,
  aoSelecionarProjeto,
  modoVisualizacao,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('ativos');

  const projetosAtivos = useMemo(
    () => projetos.filter((p) => p.ativo && !p.concluido),
    [projetos]
  );
  const projetosConcluidos = useMemo(
    () => projetos.filter((p) => p.ativo && p.concluido),
    [projetos]
  );
  const projetosInativos = useMemo(
    () => projetos.filter((p) => !p.ativo),
    [projetos]
  );

  const contagemPorAba = {
    ativos: projetosAtivos.length,
    concluidos: projetosConcluidos.length,
    inativos: projetosInativos.length,
  };

  const projetosDaAba = useMemo(() => {
    const base =
      abaAtiva === 'ativos' ? projetosAtivos :
      abaAtiva === 'concluidos' ? projetosConcluidos :
      projetosInativos;

    const term = normalizarTexto(searchTerm.trim());
    if (!term) return base;

    return base.filter((project) => {
      const clienteNome = normalizarTexto(clientesById.get(project.clienteId));
      const setorNome = normalizarTexto(setoresById.get(project.setorId));
      const titulo = normalizarTexto(project.titulo);
      const descricao = normalizarTexto(project.descricao);
      return titulo.includes(term) || descricao.includes(term) || clienteNome.includes(term) || setorNome.includes(term);
    });
  }, [abaAtiva, searchTerm, projetosAtivos, projetosConcluidos, projetosInativos, clientesById, setoresById]);

  const renderProjectCard = (project) => {
    const clienteNome = clientesById.get(project.clienteId) ?? `Cliente #${project.clienteId}`;
    const setorNome = setoresById.get(project.setorId) ?? `Setor #${project.setorId}`;
    const status = !project.ativo ? 'Inativo' : project.concluido ? 'Concluido' : 'Ativo';

    return (
      <Card
        key={project.id}
        className="border-l-4 border-l-brand-blue cursor-pointer transition-colors hover:bg-muted/20"
        role="button"
        tabIndex={0}
        onClick={() => aoSelecionarProjeto(project)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            aoSelecionarProjeto(project);
          }
        }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{project.titulo}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Cliente: {clienteNome} | Setor: {setorNome}
              </p>
            </div>
            <Badge
              variant={project.ativo ? 'default' : 'secondary'}
              className={status === 'Ativo' ? 'bg-brand-blue hover:bg-brand-blue-dark' : status === 'Concluido' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
            >
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.descricao && (
            <p className="text-sm text-muted-foreground">{project.descricao}</p>
          )}
          <div className="text-sm text-muted-foreground">
            <strong>Data de cadastro:</strong> {formatarDataHora(project.dataCadastro)}
          </div>
          <div className="text-sm text-muted-foreground">
            <strong>Tarefas:</strong> {project.tarefas?.length ?? 0}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderProjectRow = (project) => {
    const clienteNome = clientesById.get(project.clienteId) ?? `Cliente #${project.clienteId}`;
    const setorNome = setoresById.get(project.setorId) ?? `Setor #${project.setorId}`;
    const status = !project.ativo ? 'Inativo' : project.concluido ? 'Concluido' : 'Ativo';

    return (
      <TableRow key={project.id} className="hover:bg-muted/50">
        <TableCell className="font-medium">{project.titulo}</TableCell>
        <TableCell>{clienteNome}</TableCell>
        <TableCell>{setorNome}</TableCell>
        <TableCell>{project.tarefas?.length ?? 0}</TableCell>
        <TableCell>
          <Badge
            variant={project.ativo ? 'default' : 'secondary'}
            className={status === 'Ativo' ? 'bg-brand-blue hover:bg-brand-blue-dark' : status === 'Concluido' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {status}
          </Badge>
        </TableCell>
        <TableCell>{formatarDataHora(project.dataCadastro)}</TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => aoSelecionarProjeto(project)}
            className="h-8 w-8 p-0 text-brand-blue hover:bg-brand-blue hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      {/* Abas de status */}
      <div className="flex items-center gap-1 border-b">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            onClick={() => { setAbaAtiva(aba.id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              abaAtiva === aba.id
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
            }`}
          >
            {aba.label}
            {contagemPorAba[aba.id] > 0 && (
              <Badge variant="outline" className={`text-xs px-1.5 py-0 h-5 ${abaAtiva === aba.id ? aba.badgeClass : ''}`}>
                {contagemPorAba[aba.id]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div id="tour-busca" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por título, cliente ou setor..."
        />
      </div>

      {/* Lista */}
      {projetosDaAba.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4">Nenhum projeto encontrado</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm
              ? `Não encontramos projetos para "${searchTerm}".`
              : `Não há projetos ${abaAtiva === 'ativos' ? 'ativos' : abaAtiva === 'concluidos' ? 'concluídos' : 'inativos'}.`}
          </p>
        </div>
      ) : modoVisualizacao === 'cards' ? (
        <div id="tour-lista-projetos" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projetosDaAba.map(renderProjectCard)}
        </div>
      ) : (
        <div id="tour-lista-projetos" className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Tarefas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projetosDaAba.map(renderProjectRow)}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
