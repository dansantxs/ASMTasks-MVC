'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Users, Plus, Save, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../ui/layout/table';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { Textarea } from '../../../ui/form/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/form/select';
import {
  criarNivelAcesso,
  getNiveisAcesso,
  getPermissoesDisponiveis,
  getUsuariosAcesso,
  atualizarNivelAcesso,
  atualizarUsuarioAcesso,
  atualizarNivelUsuario,
  inativarNivelAcesso,
  inativarUsuario,
  reativarNivelAcesso,
  reativarUsuario,
} from './api/acessos';

const formularioVazio = {
  id: null,
  nome: '',
  descricao: '',
  ehAdministrador: false,
  permissoes: [],
};

const ordemGrupos = ['Cadastros', 'Atendimento', 'Projetos', 'Relatórios', 'Configurações'];

function obterGrupoPermissao(permissao) {
  if (permissao?.label?.includes(' - ')) {
    return permissao.label.split(' - ')[0].trim();
  }

  const prefixo = permissao?.chave?.split('.')?.[0] ?? 'Outros';
  return prefixo.charAt(0).toUpperCase() + prefixo.slice(1);
}

export default function ConfiguracoesAcessosPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(formularioVazio);
  const [edicaoUsuarios, setUserEdits] = useState({});
  const [visibilidadeCampos, setFieldVisibility] = useState({});

  const { data: permissoesDisponiveis = [] } = useQuery({
    queryKey: ['acessos-permissoes'],
    queryFn: getPermissoesDisponiveis,
  });

  const { data: niveis = [] } = useQuery({
    queryKey: ['acessos-niveis'],
    queryFn: getNiveisAcesso,
  });

  const { data: usuarios = [] } = useQuery({
    queryKey: ['acessos-usuarios'],
    queryFn: getUsuariosAcesso,
  });

  useEffect(() => {
    if (form.ehAdministrador) {
      setForm((prev) => ({
        ...prev,
        permissoes: permissoesDisponiveis.map((item) => item.chave),
      }));
    }
  }, [form.ehAdministrador, permissoesDisponiveis]);

  useEffect(() => {
    setUserEdits(
      usuarios.reduce((acc, usuario) => {
        acc[usuario.id] = {
          login: usuario.login ?? '',
          novaSenha: '',
        };
        return acc;
      }, {})
    );
  }, [usuarios]);

  useEffect(() => {
    setFieldVisibility(
      usuarios.reduce((acc, usuario) => {
        acc[usuario.id] = {
          senha: false,
        };
        return acc;
      }, {})
    );
  }, [usuarios]);

  const niveisAtivos = useMemo(
    () => niveis.filter((nivel) => nivel.ativo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [niveis]
  );

  const permissoesAgrupadas = useMemo(() => {
    const grupos = permissoesDisponiveis.reduce((acc, permissao) => {
      const grupo = obterGrupoPermissao(permissao);
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(permissao);
      return acc;
    }, {});

    return Object.entries(grupos)
      .sort(([grupoA], [grupoB]) => {
        const indiceA = ordemGrupos.indexOf(grupoA);
        const indiceB = ordemGrupos.indexOf(grupoB);
        const ordemA = indiceA === -1 ? Number.MAX_SAFE_INTEGER : indiceA;
        const ordemB = indiceB === -1 ? Number.MAX_SAFE_INTEGER : indiceB;

        if (ordemA !== ordemB) return ordemA - ordemB;
        return grupoA.localeCompare(grupoB, 'pt-BR');
      })
      .map(([grupo, itens]) => ({
        grupo,
        itens: itens.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')),
      }));
  }, [permissoesDisponiveis]);

  const salvarNivel = useMutation({
    mutationFn: (payload) => (payload.id ? atualizarNivelAcesso(payload.id, payload) : criarNivelAcesso(payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-niveis'] });
      queryClient.invalidateQueries({ queryKey: ['acessos-usuarios'] });
      setForm(formularioVazio);
      toast.success('Nível de acesso salvo com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao salvar nível de acesso.'),
  });

  const excluirNivel = useMutation({
    mutationFn: inativarNivelAcesso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-niveis'] });
      setForm(formularioVazio);
      toast.success('Nível de acesso inativado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao inativar nível de acesso.'),
  });

  const reativarNivel = useMutation({
    mutationFn: reativarNivelAcesso,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-niveis'] });
      toast.success('Nível de acesso reativado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao reativar nível de acesso.'),
  });

  const atualizarUsuario = useMutation({
    mutationFn: ({ id, nivelAcesso }) => atualizarNivelUsuario(id, { nivelAcesso }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-usuarios'] });
      toast.success('Nível do usuário atualizado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao atualizar nível do usuário.'),
  });

  const salvarUsuario = useMutation({
    mutationFn: ({ id, data }) => atualizarUsuarioAcesso(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-usuarios'] });
      toast.success('Usuário atualizado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao atualizar usuário.'),
  });

  const excluirUsuario = useMutation({
    mutationFn: inativarUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-usuarios'] });
      toast.success('Usuário inativado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao inativar usuário.'),
  });

  const restaurarUsuario = useMutation({
    mutationFn: reativarUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['acessos-usuarios'] });
      toast.success('Usuário reativado com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao reativar usuário.'),
  });

  const togglePermissao = (chave) => {
    setForm((prev) => ({
      ...prev,
      permissoes: prev.permissoes.includes(chave)
        ? prev.permissoes.filter((item) => item !== chave)
        : [...prev.permissoes, chave],
    }));
  };

  const toggleGrupoPermissoes = (itens) => {
    setForm((prev) => {
      const chavesGrupo = itens.map((item) => item.chave);
      const grupoCompletoSelecionado = chavesGrupo.every((chave) => prev.permissoes.includes(chave));

      return {
        ...prev,
        permissoes: grupoCompletoSelecionado
          ? prev.permissoes.filter((chave) => !chavesGrupo.includes(chave))
          : Array.from(new Set([...prev.permissoes, ...chavesGrupo])),
      };
    });
  };

  const handleEnviar = (e) => {
    e.preventDefault();
    salvarNivel.mutate({
      id: form.id,
      nome: form.nome,
      descricao: form.descricao,
      ehAdministrador: form.ehAdministrador,
      permissoes: form.ehAdministrador ? permissoesDisponiveis.map((item) => item.chave) : form.permissoes,
    });
  };

  const handleEditarNivel = (nivel) => {
    setForm({
      id: nivel.id,
      nome: nivel.nome,
      descricao: nivel.descricao ?? '',
      ehAdministrador: nivel.ehAdministrador,
      permissoes: nivel.permissoes ?? [],
    });
  };

  const handleAlterarEdicaoUsuario = (id, field, value) => {
    setUserEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { login: '', novaSenha: '' }),
        [field]: value,
      },
    }));
  };

  const handleSalvarUsuario = (usuario) => {
    const draft = edicaoUsuarios[usuario.id] ?? { login: usuario.login, novaSenha: '' };
    salvarUsuario.mutate({
      id: usuario.id,
      data: {
        novoLogin: draft.login,
        novaSenha: draft.novaSenha || null,
      },
    });
  };

  const alternarVisibilidadeCampo = (id, field) => {
    setFieldVisibility((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { senha: false }),
        [field]: !prev[id]?.[field],
      },
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-full px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue/10 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <h1>Níveis de Acesso e Usuários</h1>
            <p className="text-muted-foreground">
              Defina o que cada nível pode acessar e gerencie os usuários vinculados aos colaboradores
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] gap-4 items-start">
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>{form.id ? 'Editar nível de acesso' : 'Novo nível de acesso'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleEnviar}>
                <div>
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                    placeholder="Ex.: FINANCEIRO"
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={form.descricao}
                    onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o objetivo deste nível"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.ehAdministrador}
                    onChange={(e) => setForm((prev) => ({ ...prev, ehAdministrador: e.target.checked }))}
                  />
                  <span>Nível administrador</span>
                </label>

                <div>
                  <Label>Permissões</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Você pode liberar uma tela específica ou uma área inteira de uma vez.
                  </p>
                  <div className="mt-2 max-h-72 overflow-y-auto rounded-md border p-3 space-y-2">
                    {permissoesAgrupadas.map(({ grupo, itens }) => {
                      const selecionadas = itens.filter((item) => form.permissoes.includes(item.chave)).length;
                      const grupoCompletoSelecionado = selecionadas === itens.length;

                      return (
                        <div key={grupo} className="rounded-md border bg-muted/10 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{grupo}</p>
                              <p className="text-xs text-muted-foreground">
                                {form.ehAdministrador ? 'Todas liberadas pelo nível administrador' : `${selecionadas} de ${itens.length} liberadas`}
                              </p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={form.ehAdministrador}
                              onClick={() => toggleGrupoPermissoes(itens)}
                            >
                              {grupoCompletoSelecionado ? 'Remover grupo' : 'Liberar grupo'}
                            </Button>
                          </div>

                          <div className="mt-2 space-y-1">
                            {itens.map((permissao) => (
                              <label
                                key={permissao.chave}
                                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={form.ehAdministrador || form.permissoes.includes(permissao.chave)}
                                  disabled={form.ehAdministrador}
                                  onChange={() => togglePermissao(permissao.chave)}
                                />
                                <span>{permissao.label.replace(`${grupo} - `, '')}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={salvarNivel.isPending}>
                    {form.id ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                    {salvarNivel.isPending ? 'Salvando...' : form.id ? 'Salvar nível' : 'Criar nível'}
                  </Button>
                  {form.id && (
                    <Button type="button" variant="outline" tabIndex={-1} onClick={() => setForm(formularioVazio)}>
                      Cancelar edição
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Níveis de acesso cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="bg-brand-blue/5">
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {niveis.map((nivel) => (
                      <TableRow key={nivel.id}>
                        <TableCell className="font-medium">{nivel.nome}</TableCell>
                        <TableCell className="whitespace-normal">{nivel.descricao || '-'}</TableCell>
                        <TableCell>{nivel.ehAdministrador ? 'Administrador' : 'Padrão'}</TableCell>
                        <TableCell>{nivel.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                        <TableCell className="text-right whitespace-normal">
                          <div className="flex justify-end gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleEditarNivel(nivel)}>
                              Editar
                            </Button>
                            {nivel.ativo ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => excluirNivel.mutate(nivel.id)}
                                disabled={excluirNivel.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Inativar
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => reativarNivel.mutate(nivel.id)}
                                disabled={reativarNivel.isPending}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reativar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Usuários com acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
              <Table className="min-w-[920px]">
                <TableHeader>
                  <TableRow className="bg-brand-blue/5">
                    <TableHead>Colaborador vinculado</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead>Nível de acesso</TableHead>
                    <TableHead>Status do usuário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.colaboradorNome}</TableCell>
                      <TableCell className="min-w-[220px]">
                        <Input
                          type="text"
                          value={edicaoUsuarios[usuario.id]?.login ?? usuario.login}
                          onChange={(e) => handleAlterarEdicaoUsuario(usuario.id, 'login', e.target.value)}
                          placeholder="Login do usuário"
                          disabled={!usuario.ativo || salvarUsuario.isPending}
                        />
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="relative">
                          <Input
                            type={visibilidadeCampos[usuario.id]?.senha ? 'text' : 'password'}
                            value={edicaoUsuarios[usuario.id]?.novaSenha ?? ''}
                            onChange={(e) => handleAlterarEdicaoUsuario(usuario.id, 'novaSenha', e.target.value)}
                            placeholder="Digite para trocar a senha"
                            className="pr-10"
                            disabled={!usuario.ativo || salvarUsuario.isPending}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground disabled:opacity-50"
                            onClick={() => alternarVisibilidadeCampo(usuario.id, 'senha')}
                            disabled={!usuario.ativo}
                            aria-label={visibilidadeCampos[usuario.id]?.senha ? 'Ocultar senha' : 'Mostrar senha'}
                          >
                            {visibilidadeCampos[usuario.id]?.senha ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <Select
                          value={usuario.nivelAcesso}
                          onValueChange={(value) => atualizarUsuario.mutate({ id: usuario.id, nivelAcesso: value })}
                          disabled={!usuario.ativo || atualizarUsuario.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {niveisAtivos.map((nivel) => (
                              <SelectItem key={nivel.id} value={nivel.nome}>
                                {nivel.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{usuario.ativo ? 'Ativo' : 'Inativo'}</TableCell>
                      <TableCell className="text-right whitespace-normal">
                        <div className="flex justify-end gap-2">
                          {usuario.ativo && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSalvarUsuario(usuario)}
                              disabled={salvarUsuario.isPending}
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                          )}
                          {usuario.ativo ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => excluirUsuario.mutate(usuario.id)}
                              disabled={excluirUsuario.isPending}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Inativar usuário
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => restaurarUsuario.mutate(usuario.id)}
                              disabled={restaurarUsuario.isPending || !usuario.colaboradorAtivo}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Reativar usuário
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
