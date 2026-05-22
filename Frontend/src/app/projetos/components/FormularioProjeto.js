'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/base/dialog';
import { Button } from '../../../components/ui/base/button';
import { Input } from '../../../components/ui/form/input';
import { Label } from '../../../components/ui/form/label';
import { Textarea } from '../../../components/ui/form/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/form/select';
import { Plus, Trash2, Paperclip, X as XIcon, FileText, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { criarCliente, criarPrioridade, criarSetor } from '../api/projetos';
import FormularioCliente from '../../cadastros/clientes/components/FormularioCliente';
import ModalBuscaCliente from '../../../components/clientes/ModalBuscaCliente';
import { useConfiguracoesSistema, configuracoesPadrao } from '../../../services/configuracoes/api';
import FormularioPrioridade from '../../cadastros/prioridades/components/FormularioPrioridade';
import FormularioSetor from '../../cadastros/setores/components/FormularioSetor';
import DialogoAnexosTarefa from './DialogoAnexosTarefa';

function gerarTempId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function criarTarefaInicial(setorId = '') {
  return { _tempId: gerarTempId(), titulo: '', descricao: '', prioridadeId: '', setorId: setorId ? String(setorId) : '' };
}

function criarTarefaDoProjeto(tarefa) {
  return {
    _tempId: gerarTempId(),
    id: tarefa?.id ?? null,
    titulo: tarefa?.titulo ?? '',
    descricao: tarefa?.descricao ?? '',
    prioridadeId: tarefa?.prioridadeId ? String(tarefa.prioridadeId) : '',
    setorId: tarefa?.setorId ? String(tarefa.setorId) : '',
    quantidadeAnexos: tarefa?.quantidadeAnexos ?? 0,
  };
}

function criarFormularioInicial() {
  return { titulo: '', descricao: '', clienteId: '', tarefas: [criarTarefaInicial()] };
}

function CartaoTarefa({ tarefa, index, prioridadesAtivas, setoresAtivos, errors, onChange, onRemove, totalTarefas, onAbrirCriarPrioridade, onAbrirAnexos, arquivosPendentes = [], onAdicionarArquivos, onRemoverArquivo }) {
  const [showDesc, setShowDesc] = useState(Boolean(tarefa.descricao));
  const inputArquivoRef = useRef(null);
  const prioridadeSelecionada = prioridadesAtivas.find((p) => String(p.id) === tarefa.prioridadeId);
  const cor = prioridadeSelecionada?.cor;

  const handleArquivosSelecionados = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (inputArquivoRef.current) inputArquivoRef.current.value = '';
    if (files.length > 0) onAdicionarArquivos?.(files);
  };

  return (
    <div
      className="rounded-md border border-l-4 p-2 bg-card space-y-1.5"
      style={{ borderLeftColor: cor ?? 'transparent' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-xs font-medium bg-muted rounded px-1.5 py-1 text-muted-foreground shrink-0 leading-none mt-1.5">
          {index + 1}
        </span>

        <div className="flex-1 space-y-1.5 min-w-0">
          <Input
            value={tarefa.titulo}
            onChange={(e) => onChange(index, 'titulo', e.target.value)}
            placeholder="Título da tarefa *"
            className={`h-8 text-sm ${errors?.titulo ? 'border-destructive' : ''}`}
          />

          <div className="flex items-center gap-1">
            <Select
              value={tarefa.prioridadeId || ''}
              onValueChange={(v) => onChange(index, 'prioridadeId', v)}
            >
              <SelectTrigger className={`flex-1 h-8 text-sm ${errors?.prioridadeId ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Prioridade *" />
              </SelectTrigger>
              <SelectContent>
                {prioridadesAtivas.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onAbrirCriarPrioridade(index)}
              title="Cadastrar nova prioridade"
              tabIndex={-1}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Select
            value={tarefa.setorId || ''}
            onValueChange={(v) => onChange(index, 'setorId', v)}
          >
            <SelectTrigger className={`h-8 text-sm ${errors?.setorId ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Setor responsável *" />
            </SelectTrigger>
            <SelectContent>
              {setoresAtivos.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showDesc ? (
            <Textarea
              value={tarefa.descricao}
              onChange={(e) => onChange(index, 'descricao', e.target.value)}
              placeholder="Descrição da tarefa (opcional)"
              rows={1}
              className="text-sm resize-none"
            />
          ) : (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowDesc(true)}
            >
              + Adicionar descrição
            </button>
          )}

          {(errors?.titulo || errors?.prioridadeId || errors?.setorId) && (
            <div className="space-y-0.5">
              {errors.titulo && <p className="text-xs text-destructive">{errors.titulo}</p>}
              {errors.prioridadeId && <p className="text-xs text-destructive">{errors.prioridadeId}</p>}
              {errors.setorId && <p className="text-xs text-destructive">{errors.setorId}</p>}
            </div>
          )}

          {/* Arquivos: gestão real para tarefas existentes, pendentes para novas */}
          {tarefa.id && onAbrirAnexos ? (
            <button
              type="button"
              onClick={() => onAbrirAnexos(tarefa)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              <Paperclip className="h-3 w-3" />
              Arquivos
              {tarefa.quantidadeAnexos > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-medium h-4 min-w-[1rem] px-1">
                  {tarefa.quantidadeAnexos}
                </span>
              )}
            </button>
          ) : (
            <div className="space-y-1">
              {arquivosPendentes.length > 0 && (
                <div className="space-y-0.5">
                  {arquivosPendentes.map((file, fi) => (
                    <div key={fi} className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                      {file.type === 'application/pdf'
                        ? <FileText className="h-3 w-3 shrink-0 text-red-400" />
                        : <Paperclip className="h-3 w-3 shrink-0" />}
                      <span className="truncate flex-1 max-w-[140px]">{file.name}</span>
                      <button type="button" onClick={() => onRemoverArquivo?.(fi)} className="shrink-0 hover:text-destructive" tabIndex={-1}>
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => inputArquivoRef.current?.click()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                <Paperclip className="h-3 w-3" />
                Adicionar arquivo
              </button>
              <input
                ref={inputArquivoRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                multiple
                className="hidden"
                onChange={handleArquivosSelecionados}
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive mt-0.5"
          onClick={() => onRemove(index)}
          disabled={totalTarefas <= 1}
          title="Remover tarefa"
          tabIndex={-1}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function FormularioProjeto({
  open,
  onOpenChange,
  aoSalvar,
  aoMesclar,
  salvando,
  clientes,
  setores = [],
  prioridades,
  projetos = [],
  colaboradorLogadoNome,
  setorLogadoId = null,
  dadosIniciais = null,
}) {
  const [formData, setFormData] = useState(criarFormularioInicial);
  const [errors, setErrors] = useState({});
  const [sincronizarTitulo, setSincronizarTitulo] = useState(true);
  const [sincronizarDescricao, setSincronizarDescricao] = useState(true);
  const [pendingFiles, setPendingFiles] = useState({}); // { [_tempId]: File[] }
  const tarefasContainerRef = useRef(null);
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalSetor, setShowModalSetor] = useState(false);
  const [indicePrioridadeTarefa, setIndicePrioridadeTarefa] = useState(null);
  const [tarefaAnexosAberta, setTarefaAnexosAberta] = useState(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [projetosParaMesclar, setProjetosParaMesclar] = useState([]);
  const [projetoMesclarId, setProjetoMesclarId] = useState(null);
  const [pendingClienteId, setPendingClienteId] = useState(null);
  const [showModalBuscaCliente, setShowModalBuscaCliente] = useState(false);
  const queryClient = useQueryClient();
  const isEditMode = Boolean(dadosIniciais?.id);
  const { data: config = configuracoesPadrao } = useConfiguracoesSistema();

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setFormData({
          titulo: dadosIniciais.titulo ?? '',
          descricao: dadosIniciais.descricao ?? '',
          clienteId: dadosIniciais.clienteId ? String(dadosIniciais.clienteId) : '',
          tarefas: (dadosIniciais.tarefas ?? []).length
            ? dadosIniciais.tarefas.map(criarTarefaDoProjeto)
            : [criarTarefaInicial(setorLogadoId)],
        });
      } else {
        setFormData({ titulo: '', descricao: '', clienteId: '', tarefas: [criarTarefaInicial(setorLogadoId)] });
      }
      setPendingFiles({});
      setErrors({});
      setSincronizarTitulo(!isEditMode);
      setSincronizarDescricao(!isEditMode);
      setShowModalCliente(false);
      setShowModalSetor(false);
      setIndicePrioridadeTarefa(null);
      setShowMergeDialog(false);
      setProjetosParaMesclar([]);
      setProjetoMesclarId(null);
      setPendingClienteId(null);
    }
  }, [open, isEditMode, dadosIniciais]);

  const resolverNomeCliente = useCallback((c) => {
    if (config.exibicaoNomeCliente === 'nomeFantasia' && c.nomeFantasia) return c.nomeFantasia;
    return c.nome;
  }, [config.exibicaoNomeCliente]);

  const clientesMatrizes = useMemo(
    () => clientes.filter((c) => c.ativo && c.matrizId == null),
    [clientes]
  );

  // Em edição, garante que o cliente atual apareça mesmo que inativo ou filial
  const clientesParaSelecao = useMemo(() => {
    let lista;
    if (!isEditMode || !dadosIniciais?.clienteId) {
      lista = clientesMatrizes;
    } else {
      const jaIncluso = clientesMatrizes.some((c) => String(c.id) === String(dadosIniciais.clienteId));
      if (jaIncluso) {
        lista = clientesMatrizes;
      } else {
        const clienteAtual = clientes.find((c) => String(c.id) === String(dadosIniciais.clienteId));
        lista = clienteAtual ? [...clientesMatrizes, clienteAtual] : clientesMatrizes;
      }
    }
    return [...lista].sort((a, b) =>
      resolverNomeCliente(a).localeCompare(resolverNomeCliente(b), 'pt-BR', { sensitivity: 'base' })
    );
  }, [isEditMode, clientesMatrizes, clientes, dadosIniciais?.clienteId, resolverNomeCliente]);
  const setoresAtivos = useMemo(() => setores.filter((item) => item.ativo), [setores]);
  const prioridadesAtivas = useMemo(() => prioridades.filter((item) => item.ativo), [prioridades]);

  const projetosAtivosDoCliente = useMemo(() => {
    if (isEditMode || !formData.clienteId) return [];
    return projetos.filter(
      (p) => p.ativo && !p.concluido && String(p.clienteId) === String(formData.clienteId),
    );
  }, [isEditMode, formData.clienteId, projetos]);

  const atualizarTarefa = (index, field, value) => {
    setFormData((prev) => {
      const novasTarefas = prev.tarefas.map((tarefa, i) => (i === index ? { ...tarefa, [field]: value } : tarefa));
      const novoFormData = { ...prev, tarefas: novasTarefas };
      if (index === 0 && field === 'titulo' && sincronizarTitulo) novoFormData.titulo = value;
      if (index === 0 && field === 'descricao' && sincronizarDescricao) novoFormData.descricao = value;
      return novoFormData;
    });
  };

  const adicionarTarefa = () => {
    setFormData((prev) => ({ ...prev, tarefas: [...prev.tarefas, criarTarefaInicial(setorLogadoId)] }));
    setTimeout(() => {
      if (tarefasContainerRef.current) {
        tarefasContainerRef.current.scrollTop = tarefasContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  const removerTarefa = (index) => {
    setFormData((prev) => {
      if (prev.tarefas.length <= 1) return prev;
      const removida = prev.tarefas[index];
      if (removida?._tempId) {
        setPendingFiles((pf) => {
          const next = { ...pf };
          delete next[removida._tempId];
          return next;
        });
      }
      return { ...prev, tarefas: prev.tarefas.filter((_, i) => i !== index) };
    });
  };

  const adicionarArquivosPendentes = useCallback((tempId, files) => {
    setPendingFiles((pf) => ({
      ...pf,
      [tempId]: [...(pf[tempId] ?? []), ...files],
    }));
  }, []);

  const removerArquivoPendente = useCallback((tempId, fileIndex) => {
    setPendingFiles((pf) => ({
      ...pf,
      [tempId]: (pf[tempId] ?? []).filter((_, i) => i !== fileIndex),
    }));
  }, []);

  const handleClienteChange = (value) => {
    if (!isEditMode) {
      const projetosAtivos = projetos.filter(
        (p) => p.ativo && !p.concluido && String(p.clienteId) === String(value),
      );
      const temTarefas = formData.tarefas.some((t) => t.titulo.trim());
      if (projetosAtivos.length > 0 && temTarefas) {
        setPendingClienteId(value);
        setProjetosParaMesclar(projetosAtivos);
        setProjetoMesclarId(String(projetosAtivos[0].id));
        setShowMergeDialog(true);
        return;
      }
    }
    setFormData((prev) => ({ ...prev, clienteId: value }));
  };

  const handleMesclar = () => {
    if (!projetoMesclarId) return;
    const arquivos = {};
    formData.tarefas.forEach((tarefa, i) => {
      const files = pendingFiles[tarefa._tempId] ?? [];
      if (files.length > 0) arquivos[i] = files;
    });
    aoMesclar?.(
      Number(projetoMesclarId),
      formData.tarefas.map((t) => ({
        titulo: t.titulo.trim(),
        descricao: t.descricao.trim() || null,
        prioridadeId: t.prioridadeId ? Number(t.prioridadeId) : null,
        setorId: t.setorId ? Number(t.setorId) : null,
      })),
      arquivos,
    );
    setShowMergeDialog(false);
    setPendingClienteId(null);
    setProjetosParaMesclar([]);
  };

  const handleCriarNovoProjeto = () => {
    setFormData((prev) => ({ ...prev, clienteId: pendingClienteId ?? prev.clienteId }));
    setShowMergeDialog(false);
    setPendingClienteId(null);
    setProjetosParaMesclar([]);
  };

  const handleSalvarNovoCliente = async (dados) => {
    try {
      const result = await criarCliente(dados);
      setFormData((prev) => ({ ...prev, clienteId: String(result.id) }));
      queryClient.invalidateQueries({ queryKey: ['projetos-clientes'] });
      setShowModalCliente(false);
      toast.success('Cliente cadastrado.');
    } catch (error) {
      toast.error(error?.message ?? 'Erro ao cadastrar cliente.');
    }
  };

  const handleSalvarNovoSetor = async (dados) => {
    try {
      const payload = { nome: dados.name, descricao: dados.description || null };
      const result = await criarSetor(payload);
      setFormData((prev) => ({ ...prev, setorId: String(result.id) }));
      queryClient.invalidateQueries({ queryKey: ['projetos-setores'] });
      setShowModalSetor(false);
      toast.success('Setor cadastrado.');
    } catch (error) {
      toast.error(error?.message ?? 'Erro ao cadastrar setor.');
    }
  };

  const handleSalvarNovaPrioridade = async (dados) => {
    try {
      const payload = { nome: dados.name, descricao: dados.description || null, cor: dados.color };
      const result = await criarPrioridade(payload);
      if (indicePrioridadeTarefa !== null) {
        atualizarTarefa(indicePrioridadeTarefa, 'prioridadeId', String(result.id));
      }
      queryClient.invalidateQueries({ queryKey: ['projetos-prioridades'] });
      setIndicePrioridadeTarefa(null);
      toast.success('Prioridade cadastrada.');
    } catch (error) {
      toast.error(error?.message ?? 'Erro ao cadastrar prioridade.');
    }
  };

  const validarFormulario = () => {
    const nextErrors = {};
    const tarefasErrors = [];

    if (!formData.titulo.trim()) nextErrors.titulo = 'Título do projeto é obrigatório.';
    if (!formData.clienteId) nextErrors.clienteId = 'Cliente é obrigatório.';
    if (!formData.tarefas.length) nextErrors.tarefas = 'Informe ao menos uma tarefa.';

    formData.tarefas.forEach((tarefa, index) => {
      const tarefaError = {};
      if (!tarefa.titulo.trim()) tarefaError.titulo = `Título da tarefa ${index + 1} é obrigatório.`;
      if (!tarefa.prioridadeId) tarefaError.prioridadeId = `Prioridade da tarefa ${index + 1} é obrigatória.`;
      if (!tarefa.setorId) tarefaError.setorId = `Setor da tarefa ${index + 1} é obrigatório.`;
      tarefasErrors[index] = tarefaError;
    });

    if (tarefasErrors.some((error) => Object.keys(error).length > 0)) {
      nextErrors.tarefasDetalhes = tarefasErrors;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validarFormulario()) return;

    // Mapeia índice da tarefa → arquivos pendentes (somente tarefas sem id)
    const pendingFilesByIndex = {};
    formData.tarefas.forEach((tarefa, index) => {
      if (!tarefa.id) {
        const files = pendingFiles[tarefa._tempId] ?? [];
        if (files.length > 0) pendingFilesByIndex[index] = files;
      }
    });

    aoSalvar(
      {
        id: dadosIniciais?.id,
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        clienteId: Number(formData.clienteId),
        tarefas: formData.tarefas.map((tarefa) => ({
          id: tarefa.id ?? null,
          titulo: tarefa.titulo.trim(),
          descricao: tarefa.descricao.trim() || null,
          prioridadeId: Number(tarefa.prioridadeId),
          setorId: tarefa.setorId ? Number(tarefa.setorId) : null,
        })),
      },
      pendingFilesByIndex,
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full sm:max-w-[1040px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
            <DialogTitle>{isEditMode ? 'Editar projeto' : 'Criar novo projeto'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Atualize os dados do projeto e suas tarefas.'
                : 'Preencha os dados do projeto e adicione ao menos uma tarefa.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-col md:flex-row flex-1 min-h-0">

              {/* Painel esquerdo — dados do projeto */}
              <div id="tour-form-projeto-dados" className="md:w-[360px] shrink-0 px-6 py-4 space-y-4 overflow-y-auto border-r">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados do projeto</p>

                <div id="tour-form-projeto-titulo" className="space-y-2">
                  <Label htmlFor="titulo">
                    Título do projeto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => {
                      setSincronizarTitulo(false);
                      setFormData((prev) => ({ ...prev, titulo: e.target.value }));
                    }}
                    placeholder="Ex.: Implantação do módulo comercial"
                    className={errors.titulo ? 'border-destructive' : ''}
                  />
                  {sincronizarTitulo && !isEditMode && (
                    <p className="text-xs text-muted-foreground">Sincronizado com o título da tarefa</p>
                  )}
                  {errors.titulo && <p className="text-xs text-destructive">{errors.titulo}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => {
                      setSincronizarDescricao(false);
                      setFormData((prev) => ({ ...prev, descricao: e.target.value }));
                    }}
                    placeholder="Detalhes gerais do projeto"
                    rows={3}
                    className="resize-none"
                  />
                  {sincronizarDescricao && !isEditMode && (
                    <p className="text-xs text-muted-foreground">Sincronizado com a descrição da tarefa</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-1">
                    <Select
                      value={formData.clienteId || ''}
                      onValueChange={handleClienteChange}
                    >
                      <SelectTrigger className={`flex-1 ${errors.clienteId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientesParaSelecao.map((cliente) => (
                          <SelectItem key={cliente.id} value={String(cliente.id)}>
                            {resolverNomeCliente(cliente)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowModalBuscaCliente(true)}
                      title="Buscar cliente"
                      tabIndex={-1}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowModalCliente(true)}
                      title="Cadastrar novo cliente"
                      tabIndex={-1}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.clienteId && <p className="text-xs text-destructive">{errors.clienteId}</p>}
                  {projetosAtivosDoCliente.length > 0 && (
                    <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2.5">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div className="text-xs text-amber-800 space-y-1">
                        <p className="font-medium">
                          Este cliente já possui {projetosAtivosDoCliente.length === 1 ? '1 projeto ativo' : `${projetosAtivosDoCliente.length} projetos ativos`} em aberto:
                        </p>
                        <ul className="list-disc ml-3 space-y-0.5">
                          {projetosAtivosDoCliente.map((p) => (
                            <li key={p.id}>{p.titulo}</li>
                          ))}
                        </ul>
                        <p>Considere adicionar as tarefas ao projeto existente ou confirme a criação de um novo projeto.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Cadastrando por</Label>
                  <Input value={colaboradorLogadoNome || 'Colaborador logado'} readOnly disabled />
                </div>
              </div>

              {/* Painel direito — tarefas */}
              <div id="tour-form-projeto-tarefas" className="flex-1 flex flex-col min-h-0 px-6 py-4">
                <div className="shrink-0 mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tarefas ({formData.tarefas.length})
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Título e prioridade obrigatórios. Responsável e etapa são definidos posteriormente.
                  </p>
                </div>

                {errors.tarefas && <p className="text-xs text-destructive mb-2">{errors.tarefas}</p>}

                <div ref={tarefasContainerRef} className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                  {formData.tarefas.map((tarefa, index) => (
                    <CartaoTarefa
                      key={tarefa._tempId ?? `tarefa-${index}`}
                      tarefa={tarefa}
                      index={index}
                      prioridadesAtivas={prioridadesAtivas}
                      setoresAtivos={setoresAtivos}
                      errors={errors.tarefasDetalhes?.[index]}
                      onChange={atualizarTarefa}
                      onRemove={removerTarefa}
                      totalTarefas={formData.tarefas.length}
                      onAbrirCriarPrioridade={setIndicePrioridadeTarefa}
                      onAbrirAnexos={isEditMode && tarefa.id ? setTarefaAnexosAberta : undefined}
                      arquivosPendentes={!tarefa.id ? (pendingFiles[tarefa._tempId] ?? []) : undefined}
                      onAdicionarArquivos={!tarefa.id ? (files) => adicionarArquivosPendentes(tarefa._tempId, files) : undefined}
                      onRemoverArquivo={!tarefa.id ? (fi) => removerArquivoPendente(tarefa._tempId, fi) : undefined}
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarTarefa}
                  className="mt-3 w-full shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar tarefa
                </Button>
              </div>
            </div>

            <div id="tour-form-projeto-botoes" className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
              <Button type="button" variant="outline" tabIndex={-1} onClick={() => onOpenChange(false)} disabled={salvando}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={salvando}>
                {salvando ? 'Salvando...' : isEditMode ? 'Salvar alterações' : 'Criar projeto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de cadastro de cliente */}
      <FormularioCliente
        open={showModalCliente}
        onOpenChange={setShowModalCliente}
        cliente={null}
        aoSalvar={handleSalvarNovoCliente}
      />

      {/* Modal de busca de cliente */}
      <ModalBuscaCliente
        open={showModalBuscaCliente}
        onOpenChange={setShowModalBuscaCliente}
        exibicaoNomeCliente={config.exibicaoNomeCliente}
        onSelect={(c) => handleClienteChange(String(c.id))}
      />

      {/* Modal de cadastro de setor */}
      <FormularioSetor
        open={showModalSetor}
        onOpenChange={setShowModalSetor}
        setor={null}
        aoSalvar={handleSalvarNovoSetor}
        setoresExistentes={setores.map((s) => ({ ...s, name: s.nome }))}
      />

      {/* Modal de cadastro de prioridade */}
      <FormularioPrioridade
        open={indicePrioridadeTarefa !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setIndicePrioridadeTarefa(null);
        }}
        prioridade={null}
        aoSalvar={handleSalvarNovaPrioridade}
        prioridadesExistentes={prioridades.map((p) => ({ ...p, name: p.nome }))}
      />

      {/* Diálogo de imagens da tarefa */}
      <DialogoAnexosTarefa
        open={tarefaAnexosAberta !== null}
        onOpenChange={(v) => { if (!v) setTarefaAnexosAberta(null); }}
        tarefaId={tarefaAnexosAberta?.id ?? null}
        tarefaTitulo={tarefaAnexosAberta?.titulo ?? ''}
      />

      {/* Diálogo de mesclagem de tarefas com projeto existente */}
      <Dialog open={showMergeDialog} onOpenChange={(next) => { if (!next) handleCriarNovoProjeto(); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cliente com projeto ativo</DialogTitle>
            <DialogDescription>
              {projetosParaMesclar.length === 1
                ? `Este cliente já tem o projeto "${projetosParaMesclar[0]?.titulo}" em andamento. O que deseja fazer com as tarefas que você preencheu?`
                : `Este cliente já tem ${projetosParaMesclar.length} projetos ativos. Deseja adicionar as tarefas a um deles ou criar um novo projeto?`}
            </DialogDescription>
          </DialogHeader>

          {projetosParaMesclar.length > 1 && (
            <div className="space-y-2 py-2">
              <Label>Adicionar ao projeto</Label>
              <Select value={projetoMesclarId || ''} onValueChange={setProjetoMesclarId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o projeto de destino" />
                </SelectTrigger>
                <SelectContent>
                  {projetosParaMesclar.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleMesclar}
              className="bg-brand-blue hover:bg-brand-blue-dark"
              disabled={!projetoMesclarId || salvando}
            >
              {salvando
                ? 'Adicionando...'
                : projetosParaMesclar.length === 1
                  ? `Adicionar ao projeto "${projetosParaMesclar[0]?.titulo}"`
                  : 'Adicionar ao projeto selecionado'}
            </Button>
            <Button variant="outline" onClick={handleCriarNovoProjeto} disabled={salvando}>
              Criar como novo projeto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
