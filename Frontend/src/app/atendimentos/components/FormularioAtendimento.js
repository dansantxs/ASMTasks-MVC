'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../ui/base/dialog';
import { Button } from '../../../ui/base/button';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Textarea } from '../../../ui/form/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/form/select';
import { Plus, Trash2 } from 'lucide-react';
import { converterHoraParaMinutos } from '../../../shared/configuracoes-sistema/utils';

function paraValorDatetimeLocal(data) {
  const local = new Date(data);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

function minutosParaConfigNotificacao(minutos) {
  if (!Number.isFinite(minutos) || minutos <= 0) {
    return { valor: '', unidade: 'minutos' };
  }

  if (minutos % 1440 === 0) {
    return { valor: String(minutos / 1440), unidade: 'dias' };
  }

  if (minutos % 60 === 0) {
    return { valor: String(minutos / 60), unidade: 'horas' };
  }

  return { valor: String(minutos), unidade: 'minutos' };
}

function configNotificacaoParaMinutos(config) {
  const valor = Number(config?.valor ?? 0);
  if (!Number.isFinite(valor) || valor <= 0) return 0;

  if (config.unidade === 'dias') return valor * 1440;
  if (config.unidade === 'horas') return valor * 60;
  return valor;
}

export default function FormularioAtendimento({
  open,
  onOpenChange,
  clientes,
  colaboradores,
  atendimento,
  colaboradorLogadoNome,
  horaInicioAgenda,
  horaFimAgenda,
  aoSalvar,
  salvando,
}) {
  const [dadosFormulario, setDadosFormulario] = useState({
    titulo: '',
    descricao: '',
    clienteId: '',
    dataHoraInicio: '',
    dataHoraFim: '',
    colaboradoresIds: [],
    notificacoesMinutosAntecedencia: [],
  });
  const [erros, setErros] = useState({});
  const [configsNotificacao, setConfigsNotificacao] = useState([]);

  const colaboradoresAtivos = useMemo(
    () =>
      colaboradores
        .filter((c) => c.ativo)
        .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR', { sensitivity: 'base' })),
    [colaboradores]
  );

  const clientesAtivos = useMemo(
    () => clientes.filter((c) => c.ativo),
    [clientes]
  );

  useEffect(() => {
    if (!open) return;

    if (atendimento) {
      setDadosFormulario({
        titulo: atendimento.titulo ?? '',
        descricao: atendimento.descricao ?? '',
        clienteId: atendimento.clienteId ? String(atendimento.clienteId) : '',
        dataHoraInicio: atendimento.dataHoraInicio
          ? paraValorDatetimeLocal(atendimento.dataHoraInicio)
          : '',
        dataHoraFim: atendimento.dataHoraFim ? paraValorDatetimeLocal(atendimento.dataHoraFim) : '',
        colaboradoresIds: atendimento.colaboradoresIds ?? [],
        notificacoesMinutosAntecedencia: atendimento.notificacoesMinutosAntecedencia ?? [],
      });
      setConfigsNotificacao(
        (atendimento.notificacoesMinutosAntecedencia ?? []).map(minutosParaConfigNotificacao)
      );
      setErros({});
      return;
    }

    const base = new Date();
    const minutosInicio = converterHoraParaMinutos(horaInicioAgenda, 480);
    const minutosFim = converterHoraParaMinutos(horaFimAgenda, 1080);
    const agora = new Date();
    const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();
    const minutosMaxInicio = Math.max(minutosInicio, minutosFim - 60);

    if (minutosAtuais > minutosMaxInicio) {
      base.setDate(base.getDate() + 1);
      base.setHours(Math.floor(minutosInicio / 60), minutosInicio % 60, 0, 0);
    } else {
      const proximoSlot = Math.max(minutosInicio, Math.ceil(minutosAtuais / 60) * 60);
      base.setHours(Math.floor(proximoSlot / 60), proximoSlot % 60, 0, 0);
    }
    const fim = new Date(base);
    fim.setHours(fim.getHours() + 1);

    setDadosFormulario({
      titulo: '',
      descricao: '',
      clienteId: '',
      dataHoraInicio: paraValorDatetimeLocal(base),
      dataHoraFim: paraValorDatetimeLocal(fim),
      colaboradoresIds: [],
      notificacoesMinutosAntecedencia: [],
    });
    setConfigsNotificacao([]);
    setErros({});
  }, [open, atendimento, horaFimAgenda, horaInicioAgenda]);

  const estaDentroAgenda = (valor) => {
    if (!valor) return true;
    const data = new Date(valor);
    const minutos = data.getHours() * 60 + data.getMinutes();
    const minutosInicio = converterHoraParaMinutos(horaInicioAgenda, 480);
    const minutosFim = converterHoraParaMinutos(horaFimAgenda, 1080);
    return minutos >= minutosInicio && minutos <= minutosFim;
  };

  const toggleColaborador = (id) => {
    setDadosFormulario((prev) => {
      const jaIncluido = prev.colaboradoresIds.includes(id);
      return {
        ...prev,
        colaboradoresIds: jaIncluido
          ? prev.colaboradoresIds.filter((item) => item !== id)
          : [...prev.colaboradoresIds, id],
      };
    });
  };

  const adicionarConfigNotificacao = () => {
    setConfigsNotificacao((prev) => [...prev, { valor: '', unidade: 'minutos' }]);
  };

  const atualizarConfigNotificacao = (indice, patch) => {
    setConfigsNotificacao((prev) =>
      prev.map((item, i) => (i === indice ? { ...item, ...patch } : item))
    );
  };

  const removerConfigNotificacao = (indice) => {
    setConfigsNotificacao((prev) => prev.filter((_, i) => i !== indice));
  };

  const validar = () => {
    const proximosErros = {};

    if (!dadosFormulario.titulo.trim()) proximosErros.titulo = 'Título é obrigatório.';
    if (!dadosFormulario.clienteId) proximosErros.clienteId = 'Selecione um cliente.';
    if (!dadosFormulario.dataHoraInicio) proximosErros.dataHoraInicio = 'Data/hora de início é obrigatória.';
    if (
      dadosFormulario.dataHoraFim &&
      dadosFormulario.dataHoraInicio &&
      new Date(dadosFormulario.dataHoraFim) <= new Date(dadosFormulario.dataHoraInicio)
    ) {
      proximosErros.dataHoraFim = 'Data/hora final deve ser maior que a inicial.';
    }
    if (dadosFormulario.dataHoraInicio && !estaDentroAgenda(dadosFormulario.dataHoraInicio)) {
      proximosErros.dataHoraInicio = `O início deve estar entre ${horaInicioAgenda} e ${horaFimAgenda}.`;
    }
    if (dadosFormulario.dataHoraFim && !estaDentroAgenda(dadosFormulario.dataHoraFim)) {
      proximosErros.dataHoraFim = `O fim deve estar entre ${horaInicioAgenda} e ${horaFimAgenda}.`;
    }
    if (dadosFormulario.colaboradoresIds.length === 0) {
      proximosErros.colaboradoresIds = 'Selecione ao menos um colaborador para o atendimento.';
    }

    const notificacoesEmMinutos = configsNotificacao.map(configNotificacaoParaMinutos);
    const temNotificacaoInvalida = notificacoesEmMinutos.some((minutos) => minutos <= 0);
    const temNotificacoesDuplicadas = new Set(notificacoesEmMinutos).size !== notificacoesEmMinutos.length;

    if (temNotificacaoInvalida) {
      proximosErros.notificacoesMinutosAntecedencia =
        'Cada notificação deve ter valor inteiro maior que zero.';
    } else if (temNotificacoesDuplicadas) {
      proximosErros.notificacoesMinutosAntecedencia = 'Não repita notificações com o mesmo tempo.';
    }

    setErros(proximosErros);
    return Object.keys(proximosErros).length === 0;
  };

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!validar()) return;

    aoSalvar({
      titulo: dadosFormulario.titulo.trim(),
      descricao: dadosFormulario.descricao.trim() || null,
      clienteId: Number(dadosFormulario.clienteId),
      dataHoraInicio: dadosFormulario.dataHoraInicio,
      dataHoraFim: dadosFormulario.dataHoraFim || null,
      colaboradoresIds: dadosFormulario.colaboradoresIds.map(Number),
      notificacoesMinutosAntecedencia: configsNotificacao.map(configNotificacaoParaMinutos),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{atendimento ? 'Alterar Atendimento' : 'Novo Atendimento'}</DialogTitle>
          <DialogDescription>
            {atendimento
              ? 'Ajuste os dados do atendimento selecionado.'
              : 'Preencha os dados para agendar o atendimento no calendário.'}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleEnviar}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
              <Input
                id="titulo"
                value={dadosFormulario.titulo}
                onChange={(e) => setDadosFormulario((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex.: Atendimento comercial"
                className={erros.titulo ? 'border-destructive' : ''}
              />
              {erros.titulo && <p className="text-sm text-destructive">{erros.titulo}</p>}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={dadosFormulario.descricao}
                onChange={(e) => setDadosFormulario((prev) => ({ ...prev, descricao: e.target.value }))}
                placeholder="Observações do atendimento"
              />
            </div>

            <div>
              <Label>Cliente <span className="text-destructive">*</span></Label>
              <Select
                value={dadosFormulario.clienteId}
                onValueChange={(value) => setDadosFormulario((prev) => ({ ...prev, clienteId: value }))}
              >
                <SelectTrigger className={erros.clienteId ? 'border-destructive' : ''}>
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
              {erros.clienteId && <p className="text-sm text-destructive">{erros.clienteId}</p>}
            </div>

            <div>
              <Label>Cadastrado por</Label>
              <Input value={colaboradorLogadoNome || '-'} disabled />
            </div>

            <div>
              <Label htmlFor="dataHoraInicio">Data/hora início <span className="text-destructive">*</span></Label>
              <Input
                id="dataHoraInicio"
                type="datetime-local"
                value={dadosFormulario.dataHoraInicio}
                onChange={(e) => setDadosFormulario((prev) => ({ ...prev, dataHoraInicio: e.target.value }))}
                className={erros.dataHoraInicio ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Horário permitido: {horaInicioAgenda} até {horaFimAgenda}
              </p>
              {erros.dataHoraInicio && (
                <p className="text-sm text-destructive">{erros.dataHoraInicio}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dataHoraFim">Data/hora fim</Label>
              <Input
                id="dataHoraFim"
                type="datetime-local"
                value={dadosFormulario.dataHoraFim}
                onChange={(e) => setDadosFormulario((prev) => ({ ...prev, dataHoraFim: e.target.value }))}
                className={erros.dataHoraFim ? 'border-destructive' : ''}
              />
              {erros.dataHoraFim && <p className="text-sm text-destructive">{erros.dataHoraFim}</p>}
            </div>
          </div>

          <div>
            <Label>Colaboradores do atendimento <span className="text-destructive">*</span></Label>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
              {colaboradoresAtivos.map((colaborador) => (
                <label
                  key={colaborador.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={dadosFormulario.colaboradoresIds.includes(colaborador.id)}
                    onChange={() => toggleColaborador(colaborador.id)}
                  />
                  <span className="text-sm">{colaborador.nome}</span>
                </label>
              ))}
              {colaboradoresAtivos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum colaborador ativo disponível.</p>
              )}
            </div>
            {erros.colaboradoresIds && (
              <p className="text-sm text-destructive mt-1">{erros.colaboradoresIds}</p>
            )}
          </div>

          <div>
            <Label>Notificações antes do atendimento</Label>
            <div className="mt-2 rounded-md border p-3 space-y-3">
              {configsNotificacao.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação configurada.
                </p>
              )}

              {configsNotificacao.map((config, indice) => (
                <div key={`notificacao-${indice}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2">
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={config.valor}
                    onChange={(e) => atualizarConfigNotificacao(indice, { valor: e.target.value })}
                    placeholder="Valor"
                  />

                  <Select
                    value={config.unidade}
                    onValueChange={(value) => atualizarConfigNotificacao(indice, { unidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutos">Minutos antes</SelectItem>
                      <SelectItem value="horas">Horas antes</SelectItem>
                      <SelectItem value="dias">Dias antes</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removerConfigNotificacao(indice)}
                    className="w-full md:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={adicionarConfigNotificacao}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar notificação
              </Button>
            </div>
            {erros.notificacoesMinutosAntecedencia && (
              <p className="text-sm text-destructive mt-1">
                {erros.notificacoesMinutosAntecedencia}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={salvando}>
              {salvando ? 'Salvando...' : atendimento ? 'Salvar alterações' : 'Agendar Atendimento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
