'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, ImagePlus, Save, Clock3, Mail, Phone, Server, Eye, EyeOff, Paperclip } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Switch } from '../../../ui/form/switch';
import { Button } from '../../../ui/base/button';
import { configuracoesPadrao, atualizarConfiguracoesSistema, useConfiguracoesSistema } from '../../../shared/configuracoes-sistema/api';
import { buscarEnderecoPorCep } from '../../../shared/api/viacep';
import TourGuia from '../../../shared/components/TourGuia';

const PASSOS_TOUR = [
  {
    element: '#tour-cabecalho',
    popover: {
      title: 'Parametrização do Sistema',
      description: 'Nesta tela você configura os dados institucionais da empresa, o horário da agenda de atendimentos, a logo exibida nos relatórios, as configurações de e-mail e os limites de tamanho para upload de anexos.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-card-agenda',
    popover: {
      title: 'Agenda e Identificação',
      description: 'Define o intervalo de horário visível na agenda de atendimentos e os dados institucionais (razão social, CNPJ, e-mail, telefone e endereço) usados nos relatórios e documentos gerados pelo sistema.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-agenda-horarios',
    popover: {
      title: 'Horário da Agenda',
      description: 'O calendário de atendimentos exibe apenas o intervalo definido aqui. Novos agendamentos devem estar dentro deste período — por isso é importante manter os horários alinhados com o expediente da empresa.',
      side: 'bottom',
    },
  },
  {
    element: '#tour-agenda-identificacao',
    popover: {
      title: 'Dados da Empresa',
      description: 'Razão social, nome fantasia, CNPJ, inscrição estadual, e-mail e telefone. Essas informações aparecem no cabeçalho dos relatórios exportados em PDF.',
      side: 'bottom',
    },
  },
  {
    element: '#tour-agenda-endereco',
    popover: {
      title: 'Endereço da Empresa',
      description: 'Preencha o CEP para preenchimento automático de logradouro, bairro, cidade e UF via ViaCEP. Complete o número manualmente.',
      side: 'top',
    },
  },
  {
    element: '#tour-card-logo',
    popover: {
      title: 'Logo do Sistema',
      description: 'Faça upload de uma imagem para ser exibida como logo nos documentos e relatórios exportados. Clique em <strong>Remover logo</strong> para limpar a imagem atual.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-card-smtp',
    popover: {
      title: 'Configuração de E-mail (SMTP)',
      description: 'Configure o servidor de e-mail para envio de notificações de atendimento. Preencha todos os campos (servidor, porta, usuário e senha) ou deixe todos em branco para desativar o envio. Ative <strong>SSL/TLS</strong> conforme exigido pelo seu provedor.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-card-anexos',
    popover: {
      title: 'Limites de Tamanho de Anexos',
      description: 'Define o tamanho máximo permitido nos uploads. O <strong>limite global</strong> se aplica a todos os tipos de arquivo. Use os campos por tipo (imagem, PDF, Excel) para definir valores específicos — deixe em branco para herdar o limite global.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-btn-salvar',
    popover: {
      title: 'Salvar Parametrização',
      description: 'Clique aqui para salvar todas as configurações de uma vez. As alterações entram em vigor imediatamente após o salvamento.',
      side: 'top',
      align: 'end',
    },
  },
  {
    element: '#tour-btn-salvar',
    popover: {
      title: 'Possíveis Erros ao Salvar',
      description: '⛔ <strong>Hora de início obrigatória:</strong> informe o horário de início da agenda.<br>⛔ <strong>Hora de fim obrigatória:</strong> informe o horário de fim da agenda.<br>⛔ <strong>Hora final menor que inicial:</strong> o horário de fim deve ser posterior ao de início.<br>⛔ <strong>SMTP incompleto:</strong> se qualquer campo SMTP for preenchido, todos são obrigatórios (servidor, porta, usuário e senha).<br>⛔ <strong>Porta SMTP inválida:</strong> informe um número entre 1 e 65535.<br>⛔ <strong>Imagem inválida:</strong> o arquivo selecionado não pôde ser carregado — use PNG, JPG ou GIF.<br>⛔ <strong>Erro de conexão:</strong> verifique sua conexão e tente novamente.',
      side: 'top',
      align: 'end',
    },
  },
];

const emptyErrors = {};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function maskCEP(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export default function ConfiguracoesSistemaPage() {
  const queryClient = useQueryClient();
  const { data: settings = configuracoesPadrao, isLoading } = useConfiguracoesSistema();
  const [form, setForm] = useState(configuracoesPadrao);
  const [errors, setErrors] = useState(emptyErrors);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [mostrarSenhaSmtp, setMostrarSenhaSmtp] = useState(false);
  const cepAlteradoPeloUsuario = useRef(false);

  useEffect(() => {
    cepAlteradoPeloUsuario.current = false;
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    async function preencherEndereco() {
      if (!cepAlteradoPeloUsuario.current) return;
      const cepLimpo = String(form.cep || '').replace(/\D/g, '');
      if (cepLimpo.length !== 8) return;

      setBuscandoCep(true);
      try {
        const endereco = await buscarEnderecoPorCep(cepLimpo, controller.signal);
        if (!ativo || !endereco) return;

        setForm((prev) => ({
          ...prev,
          logradouro: endereco.logradouro || prev.logradouro || '',
          bairro: endereco.bairro || prev.bairro || '',
          cidade: endereco.cidade || prev.cidade || '',
          uf: endereco.uf || prev.uf || '',
        }));
      } finally {
        if (ativo) setBuscandoCep(false);
      }
    }

    preencherEndereco();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [form.cep]);

  const salvar = useMutation({
    mutationFn: atualizarConfiguracoesSistema,
    onSuccess: (data) => {
      queryClient.setQueryData(['configuracoes-sistema'], data);
      toast.success('Parametrização salva com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao salvar parametrização.'),
  });

  const validate = () => {
    const nextErrors = {};

    if (!form.horaInicioAgenda) nextErrors.horaInicioAgenda = 'Informe a hora de início.';
    if (!form.horaFimAgenda) nextErrors.horaFimAgenda = 'Informe a hora de fim.';
    if (
      form.horaInicioAgenda &&
      form.horaFimAgenda &&
      form.horaInicioAgenda >= form.horaFimAgenda
    ) {
      nextErrors.horaFimAgenda = 'A hora final deve ser maior que a inicial.';
    }

    const smtpConfiguradoParcialmente =
      form.smtpServidor.trim() ||
      form.smtpPorta.trim() ||
      form.smtpUsuario.trim() ||
      form.smtpSenha.trim();

    if (smtpConfiguradoParcialmente) {
      if (!form.smtpServidor.trim()) nextErrors.smtpServidor = 'Informe o servidor SMTP.';
      if (!form.smtpPorta.trim()) {
        nextErrors.smtpPorta = 'Informe a porta SMTP.';
      } else {
        const porta = Number(form.smtpPorta);
        if (!Number.isInteger(porta) || porta <= 0 || porta > 65535) {
          nextErrors.smtpPorta = 'Informe uma porta válida (1 a 65535).';
        }
      }
      if (!form.smtpUsuario.trim()) nextErrors.smtpUsuario = 'Informe o usuário SMTP.';
      if (!form.smtpSenha.trim()) nextErrors.smtpSenha = 'Informe a senha SMTP.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) return;
    salvar.mutate(form);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, logoBase64: dataUrl }));
    } catch {
      toast.error('Não foi possível carregar a imagem selecionada.');
    }
  };

  const clearLogo = () => setForm((prev) => ({ ...prev, logoBase64: null }));

  const handleLogoDocumentosUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((prev) => ({ ...prev, logoDocumentosBase64: dataUrl }));
    } catch {
      toast.error('Não foi possível carregar a imagem selecionada.');
    }
  };

  const clearLogoDocumentos = () => setForm((prev) => ({ ...prev, logoDocumentosBase64: null }));

  if (isLoading) {
    return <div className="p-6">Carregando parametrização do sistema...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div id="tour-cabecalho" className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/10 rounded-lg">
              <Building2 className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <h1>Parametrização do Sistema</h1>
              <p className="text-muted-foreground">
                Defina os dados institucionais usados na agenda, relatórios e demais áreas do sistema
              </p>
            </div>
          </div>
          <TourGuia passos={PASSOS_TOUR} />
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <Card id="tour-card-agenda">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5" />
                  Agenda e identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div id="tour-agenda-horarios" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="horaInicioAgenda">Hora de início da agenda</Label>
                    <Input
                      id="horaInicioAgenda"
                      type="time"
                      value={form.horaInicioAgenda}
                      onChange={(e) => setForm((prev) => ({ ...prev, horaInicioAgenda: e.target.value }))}
                      className={errors.horaInicioAgenda ? 'border-destructive' : ''}
                    />
                    {errors.horaInicioAgenda && <p className="text-sm text-destructive mt-1">{errors.horaInicioAgenda}</p>}
                  </div>

                  <div>
                    <Label htmlFor="horaFimAgenda">Hora de fim da agenda</Label>
                    <Input
                      id="horaFimAgenda"
                      type="time"
                      value={form.horaFimAgenda}
                      onChange={(e) => setForm((prev) => ({ ...prev, horaFimAgenda: e.target.value }))}
                      className={errors.horaFimAgenda ? 'border-destructive' : ''}
                    />
                    {errors.horaFimAgenda && <p className="text-sm text-destructive mt-1">{errors.horaFimAgenda}</p>}
                  </div>
                </div>

                <div id="tour-agenda-identificacao" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razaoSocial">Razão social</Label>
                    <Input
                      id="razaoSocial"
                      value={form.razaoSocial}
                      onChange={(e) => setForm((prev) => ({ ...prev, razaoSocial: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nomeFantasia">Nome fantasia</Label>
                    <Input
                      id="nomeFantasia"
                      value={form.nomeFantasia}
                      onChange={(e) => setForm((prev) => ({ ...prev, nomeFantasia: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={form.cnpj}
                      onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="inscricaoEstadual">Inscricao estadual</Label>
                    <Input
                      id="inscricaoEstadual"
                      value={form.inscricaoEstadual}
                      onChange={(e) => setForm((prev) => ({ ...prev, inscricaoEstadual: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <div className="relative">
                      <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <div className="relative">
                      <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="telefone"
                        className="pl-9"
                        value={form.telefone}
                        onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div id="tour-agenda-endereco" className="space-y-4">
                  <Label>Endereço da empresa</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP {buscandoCep ? '(buscando...)' : ''}</Label>
                      <Input
                        id="cep"
                        value={form.cep}
                        onChange={(e) => { cepAlteradoPeloUsuario.current = true; setForm((prev) => ({ ...prev, cep: maskCEP(e.target.value) })); }}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="logradouro">Logradouro</Label>
                      <Input
                        id="logradouro"
                        value={form.logradouro}
                        onChange={(e) => setForm((prev) => ({ ...prev, logradouro: e.target.value }))}
                        placeholder="Rua, avenida, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="numero">Numero</Label>
                      <Input
                        id="numero"
                        value={form.numero}
                        onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))}
                        placeholder="Numero"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={form.bairro}
                        onChange={(e) => setForm((prev) => ({ ...prev, bairro: e.target.value }))}
                        placeholder="Bairro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={form.cidade}
                        onChange={(e) => setForm((prev) => ({ ...prev, cidade: e.target.value }))}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="uf">UF</Label>
                      <Input
                        id="uf"
                        value={form.uf}
                        onChange={(e) => setForm((prev) => ({ ...prev, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                        placeholder="UF"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card id="tour-card-logo">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  Logos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Logo do ícone (fundo escuro)</Label>
                  <p className="text-xs text-muted-foreground">Usada como ícone da aba do navegador. Recomendado: versão branca ou clara do logo.</p>
                  <div className="rounded-lg border border-dashed p-4 space-y-3 bg-slate-800">
                    {form.logoBase64 ? (
                      <img src={form.logoBase64} alt="Logo do ícone" className="h-20 max-w-full object-contain" />
                    ) : (
                      <div className="text-sm text-slate-400">Nenhuma imagem definida.</div>
                    )}
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} className="bg-white" />
                    {form.logoBase64 && (
                      <Button type="button" variant="outline" size="sm" onClick={clearLogo} className="bg-white">
                        Remover
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo para documentos (fundo claro)</Label>
                  <p className="text-xs text-muted-foreground">Usada em relatórios e documentos exportados em PDF. Recomendado: versão colorida ou azul do logo.</p>
                  <div className="rounded-lg border border-dashed p-4 space-y-3">
                    {form.logoDocumentosBase64 ? (
                      <img src={form.logoDocumentosBase64} alt="Logo para documentos" className="h-20 max-w-full object-contain" />
                    ) : (
                      <div className="text-sm text-muted-foreground">Nenhuma imagem definida.</div>
                    )}
                    <Input type="file" accept="image/*" onChange={handleLogoDocumentosUpload} />
                    {form.logoDocumentosBase64 && (
                      <Button type="button" variant="outline" size="sm" onClick={clearLogoDocumentos}>
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card id="tour-card-smtp">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configuração de envio de e-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpServidor">Servidor SMTP</Label>
                  <Input
                    id="smtpServidor"
                    value={form.smtpServidor}
                    onChange={(e) => setForm((prev) => ({ ...prev, smtpServidor: e.target.value }))}
                    placeholder="smtp.exemplo.com"
                    className={errors.smtpServidor ? 'border-destructive' : ''}
                  />
                  {errors.smtpServidor && <p className="text-sm text-destructive mt-1">{errors.smtpServidor}</p>}
                </div>

                <div>
                  <Label htmlFor="smtpPorta">Porta SMTP</Label>
                  <Input
                    id="smtpPorta"
                    type="number"
                    min="1"
                    max="65535"
                    value={form.smtpPorta}
                    onChange={(e) => setForm((prev) => ({ ...prev, smtpPorta: e.target.value }))}
                    placeholder="587"
                    className={errors.smtpPorta ? 'border-destructive' : ''}
                  />
                  {errors.smtpPorta && <p className="text-sm text-destructive mt-1">{errors.smtpPorta}</p>}
                </div>

                <div>
                  <Label htmlFor="smtpUsuario">Usuário SMTP</Label>
                  <Input
                    id="smtpUsuario"
                    value={form.smtpUsuario}
                    onChange={(e) => setForm((prev) => ({ ...prev, smtpUsuario: e.target.value }))}
                    placeholder="usuario@dominio.com"
                    className={errors.smtpUsuario ? 'border-destructive' : ''}
                  />
                  {errors.smtpUsuario && <p className="text-sm text-destructive mt-1">{errors.smtpUsuario}</p>}
                </div>

                <div>
                  <Label htmlFor="smtpSenha">Senha SMTP</Label>
                  <div className="relative">
                    <Input
                      id="smtpSenha"
                      type={mostrarSenhaSmtp ? 'text' : 'password'}
                      value={form.smtpSenha}
                      onChange={(e) => setForm((prev) => ({ ...prev, smtpSenha: e.target.value }))}
                      className={errors.smtpSenha ? 'border-destructive pr-10' : 'pr-10'}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground"
                      onClick={() => setMostrarSenhaSmtp((prev) => !prev)}
                      aria-label={mostrarSenhaSmtp ? 'Ocultar senha SMTP' : 'Mostrar senha SMTP'}
                    >
                      {mostrarSenhaSmtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.smtpSenha && <p className="text-sm text-destructive mt-1">{errors.smtpSenha}</p>}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <Switch
                  checked={Boolean(form.smtpUsarSslTls)}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, smtpUsarSslTls: checked }))}
                />
                <span>Usar SSL/TLS no envio de e-mail</span>
              </label>
            </CardContent>
          </Card>

          <Card id="tour-card-anexos">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Limites de tamanho de anexos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Define o tamanho máximo permitido por upload. Use os campos por tipo para sobrescrever o limite global; deixe em branco para usar o padrão.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="anexoTamanhoMaximoMB">Limite global (MB)</Label>
                  <Input
                    id="anexoTamanhoMaximoMB"
                    type="number"
                    min="1"
                    max="500"
                    value={form.anexoTamanhoMaximoMB ?? 20}
                    onChange={(e) => setForm((prev) => ({ ...prev, anexoTamanhoMaximoMB: Number(e.target.value) || 20 }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="anexoLimiteImagemMB">Limite para imagens (MB)</Label>
                  <Input
                    id="anexoLimiteImagemMB"
                    type="number"
                    min="1"
                    max="500"
                    placeholder={`Padrão: ${form.anexoTamanhoMaximoMB ?? 20} MB`}
                    value={form.anexoLimiteImagemMB ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, anexoLimiteImagemMB: e.target.value === '' ? null : Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="anexoLimitePdfMB">Limite para PDF (MB)</Label>
                  <Input
                    id="anexoLimitePdfMB"
                    type="number"
                    min="1"
                    max="500"
                    placeholder={`Padrão: ${form.anexoTamanhoMaximoMB ?? 20} MB`}
                    value={form.anexoLimitePdfMB ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, anexoLimitePdfMB: e.target.value === '' ? null : Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="anexoLimiteExcelMB">Limite para Excel (MB)</Label>
                  <Input
                    id="anexoLimiteExcelMB"
                    type="number"
                    min="1"
                    max="500"
                    placeholder={`Padrão: ${form.anexoTamanhoMaximoMB ?? 20} MB`}
                    value={form.anexoLimiteExcelMB ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, anexoLimiteExcelMB: e.target.value === '' ? null : Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div id="tour-btn-salvar" className="flex justify-end">
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={salvar.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {salvar.isPending ? 'Salvando...' : 'Salvar parametrização'}
            </Button>
          </div>
        </form>

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
