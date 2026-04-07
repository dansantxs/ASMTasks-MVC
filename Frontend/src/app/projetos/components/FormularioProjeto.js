'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../ui/base/dialog';
import { Button } from '../../../ui/base/button';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Textarea } from '../../../ui/form/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/form/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { criarCliente, criarPrioridade, criarSetor } from '../api/projetos';
import FormularioCliente from '../../cadastros/clientes/components/FormularioCliente';
import FormularioPrioridade from '../../cadastros/prioridades/components/FormularioPrioridade';
import FormularioSetor from '../../cadastros/setores/components/FormularioSetor';

function criarTarefaInicial() {
  return { titulo: '', descricao: '', prioridadeId: '' };
}

function criarTarefaDoProjeto(tarefa) {
  return {
    id: tarefa?.id ?? null,
    titulo: tarefa?.titulo ?? '',
    descricao: tarefa?.descricao ?? '',
    prioridadeId: tarefa?.prioridadeId ? String(tarefa.prioridadeId) : '',
  };
}

function criarFormularioInicial() {
  return { titulo: '', descricao: '', clienteId: '', setorId: '', tarefas: [criarTarefaInicial()] };
}

function CartaoTarefa({ tarefa, index, prioridadesAtivas, errors, onChange, onRemove, totalTarefas, onAbrirCriarPrioridade }) {
  const [showDesc, setShowDesc] = useState(Boolean(tarefa.descricao));
  const prioridadeSelecionada = prioridadesAtivas.find((p) => String(p.id) === tarefa.prioridadeId);
  const cor = prioridadeSelecionada?.cor;

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
              value={tarefa.prioridadeId || undefined}
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

          {(errors?.titulo || errors?.prioridadeId) && (
            <div className="space-y-0.5">
              {errors.titulo && <p className="text-xs text-destructive">{errors.titulo}</p>}
              {errors.prioridadeId && <p className="text-xs text-destructive">{errors.prioridadeId}</p>}
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
  salvando,
  clientes,
  setores,
  prioridades,
  colaboradorLogadoNome,
  dadosIniciais = null,
}) {
  const [formData, setFormData] = useState(criarFormularioInicial);
  const [errors, setErrors] = useState({});
  const tarefasContainerRef = useRef(null);
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showModalSetor, setShowModalSetor] = useState(false);
  const [indicePrioridadeTarefa, setIndicePrioridadeTarefa] = useState(null);
  const queryClient = useQueryClient();
  const isEditMode = Boolean(dadosIniciais?.id);

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setFormData({
          titulo: dadosIniciais.titulo ?? '',
          descricao: dadosIniciais.descricao ?? '',
          clienteId: dadosIniciais.clienteId ? String(dadosIniciais.clienteId) : '',
          setorId: dadosIniciais.setorId ? String(dadosIniciais.setorId) : '',
          tarefas: (dadosIniciais.tarefas ?? []).length
            ? dadosIniciais.tarefas.map(criarTarefaDoProjeto)
            : [criarTarefaInicial()],
        });
      } else {
        setFormData(criarFormularioInicial());
      }
      setErrors({});
      setShowModalCliente(false);
      setShowModalSetor(false);
      setIndicePrioridadeTarefa(null);
    }
  }, [open, isEditMode, dadosIniciais]);

  const clientesAtivos = useMemo(() => clientes.filter((item) => item.ativo), [clientes]);
  const setoresAtivos = useMemo(() => setores.filter((item) => item.ativo), [setores]);
  const prioridadesAtivas = useMemo(() => prioridades.filter((item) => item.ativo), [prioridades]);

  const atualizarTarefa = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tarefas: prev.tarefas.map((tarefa, i) => (i === index ? { ...tarefa, [field]: value } : tarefa)),
    }));
  };

  const adicionarTarefa = () => {
    setFormData((prev) => ({ ...prev, tarefas: [...prev.tarefas, criarTarefaInicial()] }));
    setTimeout(() => {
      if (tarefasContainerRef.current) {
        tarefasContainerRef.current.scrollTop = tarefasContainerRef.current.scrollHeight;
      }
    }, 0);
  };

  const removerTarefa = (index) => {
    setFormData((prev) => {
      if (prev.tarefas.length <= 1) return prev;
      return { ...prev, tarefas: prev.tarefas.filter((_, i) => i !== index) };
    });
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
    if (!formData.setorId) nextErrors.setorId = 'Setor é obrigatório.';
    if (!formData.tarefas.length) nextErrors.tarefas = 'Informe ao menos uma tarefa.';

    formData.tarefas.forEach((tarefa, index) => {
      const tarefaError = {};
      if (!tarefa.titulo.trim()) tarefaError.titulo = `Título da tarefa ${index + 1} é obrigatório.`;
      if (!tarefa.prioridadeId) tarefaError.prioridadeId = `Prioridade da tarefa ${index + 1} é obrigatória.`;
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

    aoSalvar({
      id: dadosIniciais?.id,
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim() || null,
      clienteId: Number(formData.clienteId),
      setorId: Number(formData.setorId),
      tarefas: formData.tarefas.map((tarefa) => ({
        id: tarefa.id ?? null,
        titulo: tarefa.titulo.trim(),
        descricao: tarefa.descricao.trim() || null,
        prioridadeId: Number(tarefa.prioridadeId),
      })),
    });
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
              <div className="md:w-[360px] shrink-0 px-6 py-4 space-y-4 overflow-y-auto border-r">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados do projeto</p>

                <div className="space-y-2">
                  <Label htmlFor="titulo">
                    Título do projeto <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Ex.: Implantação do módulo comercial"
                    className={errors.titulo ? 'border-destructive' : ''}
                  />
                  {errors.titulo && <p className="text-xs text-destructive">{errors.titulo}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Detalhes gerais do projeto"
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>
                    Cliente <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-1">
                    <Select
                      value={formData.clienteId || undefined}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, clienteId: value }))}
                    >
                      <SelectTrigger className={`flex-1 ${errors.clienteId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientesAtivos.map((cliente) => (
                          <SelectItem key={cliente.id} value={String(cliente.id)}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                </div>

                <div className="space-y-2">
                  <Label>
                    Setor <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-1">
                    <Select
                      value={formData.setorId || undefined}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, setorId: value }))}
                    >
                      <SelectTrigger className={`flex-1 ${errors.setorId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Selecione o setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {setoresAtivos.map((setor) => (
                          <SelectItem key={setor.id} value={String(setor.id)}>
                            {setor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setShowModalSetor(true)}
                      title="Cadastrar novo setor"
                      tabIndex={-1}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.setorId && <p className="text-xs text-destructive">{errors.setorId}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Cadastrando por</Label>
                  <Input value={colaboradorLogadoNome || 'Colaborador logado'} readOnly disabled />
                </div>
              </div>

              {/* Painel direito — tarefas */}
              <div className="flex-1 flex flex-col min-h-0 px-6 py-4">
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
                      key={`tarefa-${index}`}
                      tarefa={tarefa}
                      index={index}
                      prioridadesAtivas={prioridadesAtivas}
                      errors={errors.tarefasDetalhes?.[index]}
                      onChange={atualizarTarefa}
                      onRemove={removerTarefa}
                      totalTarefas={formData.tarefas.length}
                      onAbrirCriarPrioridade={setIndicePrioridadeTarefa}
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

            <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
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
    </>
  );
}
