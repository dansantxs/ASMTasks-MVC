'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../ui/base/dialog';
import { Button } from '../../../ui/base/button';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Textarea } from '../../../ui/form/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/form/select';
import { Plus, Trash2 } from 'lucide-react';

function criarTarefaInicial() {
  return {
    titulo: '',
    descricao: '',
    prioridadeId: '',
  };
}

function criarTarefaDoProjeto(tarefa) {
  return {
    titulo: tarefa?.titulo ?? '',
    descricao: tarefa?.descricao ?? '',
    prioridadeId: tarefa?.prioridadeId ? String(tarefa.prioridadeId) : '',
  };
}

function criarFormularioInicial() {
  return {
    titulo: '',
    descricao: '',
    clienteId: '',
    setorId: '',
    tarefas: [criarTarefaInicial()],
  };
}

export default function ProjectForm({
  open,
  onOpenChange,
  onSave,
  isSaving,
  clientes,
  setores,
  prioridades,
  colaboradorLogadoNome,
  initialData = null,
}) {
  const [formData, setFormData] = useState(criarFormularioInicial);
  const [errors, setErrors] = useState({});
  const isEditMode = Boolean(initialData?.id);

  useEffect(() => {
    if (open) {
      if (isEditMode) {
        setFormData({
          titulo: initialData.titulo ?? '',
          descricao: initialData.descricao ?? '',
          clienteId: initialData.clienteId ? String(initialData.clienteId) : '',
          setorId: initialData.setorId ? String(initialData.setorId) : '',
          tarefas: (initialData.tarefas ?? []).length
            ? initialData.tarefas.map(criarTarefaDoProjeto)
            : [criarTarefaInicial()],
        });
      } else {
        setFormData(criarFormularioInicial());
      }
      setErrors({});
    }
  }, [open, isEditMode, initialData]);

  const clientesAtivos = useMemo(
    () => clientes.filter((item) => item.ativo),
    [clientes]
  );
  const setoresAtivos = useMemo(
    () => setores.filter((item) => item.ativo),
    [setores]
  );
  const prioridadesAtivas = useMemo(
    () => prioridades.filter((item) => item.ativo),
    [prioridades]
  );

  const atualizarTarefa = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tarefas: prev.tarefas.map((tarefa, i) => (i === index ? { ...tarefa, [field]: value } : tarefa)),
    }));
  };

  const adicionarTarefa = () => {
    setFormData((prev) => ({
      ...prev,
      tarefas: [...prev.tarefas, criarTarefaInicial()],
    }));
  };

  const removerTarefa = (index) => {
    setFormData((prev) => {
      if (prev.tarefas.length <= 1) return prev;
      return {
        ...prev,
        tarefas: prev.tarefas.filter((_, i) => i !== index),
      };
    });
  };

  const validarFormulario = () => {
    const nextErrors = {};
    const tarefasErrors = [];

    if (!formData.titulo.trim()) {
      nextErrors.titulo = 'Titulo do projeto e obrigatorio.';
    }

    if (!formData.clienteId) {
      nextErrors.clienteId = 'Cliente e obrigatorio.';
    }

    if (!formData.setorId) {
      nextErrors.setorId = 'Setor e obrigatorio.';
    }

    if (!formData.tarefas.length) {
      nextErrors.tarefas = 'Informe ao menos uma tarefa.';
    }

    formData.tarefas.forEach((tarefa, index) => {
      const tarefaError = {};

      if (!tarefa.titulo.trim()) {
        tarefaError.titulo = `Titulo da tarefa ${index + 1} e obrigatorio.`;
      }

      if (!tarefa.prioridadeId) {
        tarefaError.prioridadeId = `Prioridade da tarefa ${index + 1} e obrigatoria.`;
      }

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

    onSave({
      id: initialData?.id,
      titulo: formData.titulo.trim(),
      descricao: formData.descricao.trim() || null,
      clienteId: Number(formData.clienteId),
      setorId: Number(formData.setorId),
      tarefas: formData.tarefas.map((tarefa) => ({
        titulo: tarefa.titulo.trim(),
        descricao: tarefa.descricao.trim() || null,
        prioridadeId: Number(tarefa.prioridadeId),
        colaboradorResponsavelId: null,
        dataHoraAtribuicao: null,
        etapaId: null,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar projeto' : 'Criar novo projeto'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Atualize os dados do projeto e suas tarefas.'
              : 'Informe os dados do projeto e adicione ao menos uma tarefa.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="titulo">
                Titulo do projeto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(event) => setFormData((prev) => ({ ...prev, titulo: event.target.value }))}
                placeholder="Ex.: Implantacao do modulo comercial"
                className={errors.titulo ? 'border-destructive' : ''}
              />
              {errors.titulo && <p className="text-sm text-destructive">{errors.titulo}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descricao do projeto</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(event) => setFormData((prev) => ({ ...prev, descricao: event.target.value }))}
                placeholder="Detalhes gerais do projeto"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.clienteId || undefined}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger className={errors.clienteId ? 'border-destructive' : ''}>
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
              {errors.clienteId && <p className="text-sm text-destructive">{errors.clienteId}</p>}
            </div>

            <div className="space-y-2">
              <Label>
                Setor <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.setorId || undefined}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, setorId: value }))}
              >
                <SelectTrigger className={errors.setorId ? 'border-destructive' : ''}>
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
              {errors.setorId && <p className="text-sm text-destructive">{errors.setorId}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cadastrando por</Label>
              <Input
                value={colaboradorLogadoNome || 'Colaborador logado'}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3>Tarefas do projeto</h3>
                <p className="text-sm text-muted-foreground">
                  Cada tarefa precisa de titulo e prioridade. Campos de atribuicao serao preenchidos em outra tela.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={adicionarTarefa}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar tarefa
              </Button>
            </div>

            {errors.tarefas && <p className="text-sm text-destructive">{errors.tarefas}</p>}

            <div className="space-y-3">
              {formData.tarefas.map((tarefa, index) => {
                const tarefaErrors = errors.tarefasDetalhes?.[index] ?? {};

                return (
                  <div key={`tarefa-${index}`} className="rounded-lg border p-4 space-y-3 bg-card">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Tarefa {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removerTarefa(index)}
                        disabled={formData.tarefas.length <= 1}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          Titulo da tarefa <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          value={tarefa.titulo}
                          onChange={(event) => atualizarTarefa(index, 'titulo', event.target.value)}
                          placeholder="Ex.: Levantamento de requisitos"
                          className={tarefaErrors.titulo ? 'border-destructive' : ''}
                        />
                        {tarefaErrors.titulo && (
                          <p className="text-sm text-destructive">{tarefaErrors.titulo}</p>
                        )}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>Descricao da tarefa</Label>
                        <Textarea
                          value={tarefa.descricao}
                          onChange={(event) => atualizarTarefa(index, 'descricao', event.target.value)}
                          placeholder="Detalhes tecnicos da tarefa"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>
                          Prioridade <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={tarefa.prioridadeId || undefined}
                          onValueChange={(value) => atualizarTarefa(index, 'prioridadeId', value)}
                        >
                          <SelectTrigger className={tarefaErrors.prioridadeId ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            {prioridadesAtivas.map((prioridade) => (
                              <SelectItem key={prioridade.id} value={String(prioridade.id)}>
                                {prioridade.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {tarefaErrors.prioridadeId && (
                          <p className="text-sm text-destructive">{tarefaErrors.prioridadeId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={isSaving}>
              {isSaving ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Criar projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
