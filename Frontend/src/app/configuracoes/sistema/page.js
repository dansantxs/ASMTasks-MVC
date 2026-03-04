'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, ImagePlus, Save, Clock3, Mail, Phone } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/layout/card';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import { Button } from '../../../ui/base/button';
import { defaultSystemSettings, updateSystemSettings, useSystemSettingsQuery } from '../../../shared/system-settings/api';
import { buscarEnderecoPorCep } from '../../../shared/api/viacep';

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
  const { data: settings = defaultSystemSettings, isLoading } = useSystemSettingsQuery();
  const [form, setForm] = useState(defaultSystemSettings);
  const [errors, setErrors] = useState(emptyErrors);
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    let ativo = true;

    async function preencherEndereco() {
      const cepLimpo = String(form.cep || '').replace(/\D/g, '');
      if (cepLimpo.length !== 8) return;

      setBuscandoCep(true);
      try {
        const endereco = await buscarEnderecoPorCep(cepLimpo);
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
    };
  }, [form.cep]);

  const salvar = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['system-settings'], data);
      toast.success('Parametrizacao salva com sucesso.');
    },
    onError: (error) => toast.error(error?.message ?? 'Erro ao salvar parametrizacao.'),
  });

  const validate = () => {
    const nextErrors = {};

    if (!form.horaInicioAgenda) nextErrors.horaInicioAgenda = 'Informe a hora de inicio.';
    if (!form.horaFimAgenda) nextErrors.horaFimAgenda = 'Informe a hora de fim.';
    if (
      form.horaInicioAgenda &&
      form.horaFimAgenda &&
      form.horaInicioAgenda >= form.horaFimAgenda
    ) {
      nextErrors.horaFimAgenda = 'A hora final deve ser maior que a inicial.';
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
      setForm((prev) => ({
        ...prev,
        logoBase64: dataUrl,
      }));
    } catch {
      toast.error('Nao foi possivel carregar a imagem selecionada.');
    }
  };

  const clearLogo = () => {
    setForm((prev) => ({
      ...prev,
      logoBase64: null,
    }));
  };

  if (isLoading) {
    return <div className="p-6">Carregando parametrizacao do sistema...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-blue/10 rounded-lg">
            <Building2 className="h-6 w-6 text-brand-blue" />
          </div>
          <div>
            <h1>Parametrizacao do Sistema</h1>
            <p className="text-muted-foreground">
              Defina os dados institucionais usados na agenda, relatorios e demais areas do sistema
            </p>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5" />
                  Agenda e identificacao
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="horaInicioAgenda">Hora de inicio da agenda</Label>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razaoSocial">Razao social</Label>
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

                <div className="space-y-4">
                  <Label>Endereco da empresa</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="cep">CEP {buscandoCep ? '(buscando...)' : ''}</Label>
                      <Input
                        id="cep"
                        value={form.cep}
                        onChange={(e) => setForm((prev) => ({ ...prev, cep: maskCEP(e.target.value) }))}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5" />
                  Logo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Logo do sistema</Label>
                  <div className="rounded-lg border border-dashed p-4 space-y-3">
                    {form.logoBase64 ? (
                      <img src={form.logoBase64} alt="Logo do sistema" className="h-28 max-w-full object-contain" />
                    ) : (
                      <div className="text-sm text-muted-foreground">Nenhuma imagem definida.</div>
                    )}

                    <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                    {form.logoBase64 && (
                      <Button type="button" variant="outline" size="sm" onClick={clearLogo}>
                        Remover logo
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark" disabled={salvar.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {salvar.isPending ? 'Salvando...' : 'Salvar parametrizacao'}
            </Button>
          </div>
        </form>

        <Toaster position="top-right" />
      </div>
    </div>
  );
}
