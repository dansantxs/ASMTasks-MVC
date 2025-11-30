'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../ui/form/select';
import { buscarEnderecoPorCep } from '../../../../shared/api/viacep';

const validarCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  let digito1 = resto >= 10 ? 0 : resto;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  let digito2 = resto >= 10 ? 0 : resto;
  return parseInt(cpf.charAt(9)) === digito1 && parseInt(cpf.charAt(10)) === digito2;
};

const validarCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
};

const mascararCPF = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);

const mascararCNPJ = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);

const mascararCEP = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);

const mascararTelefone = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);

const mascararRG = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 12);

const mascararInscricaoEstadual = (value) =>
  value.replace(/\D/g, '').substring(0, 20);

export default function ClientForm({
  open,
  onOpenChange,
  client,
  onSave
}) {
  const [formData, setFormData] = useState({
    nome: '',
    tipoPessoa: 'F',
    documento: '',
    rg: '',
    inscricaoEstadual: '',
    email: '',
    telefone: '',
    cep: '',
    cidade: '',
    uf: '',
    logradouro: '',
    bairro: '',
    numero: '',
    site: '',
    dataReferencia: '',
    ativo: true
  });

  const [errors, setErrors] = useState({});
  const [buscandoCep, setBuscandoCep] = useState(false);

  const documentoRef = useRef(null);
  const rgRef = useRef(null);
  const ieRef = useRef(null);
  const telefoneRef = useRef(null);
  const cepRef = useRef(null);

  const refMap = {
    documento: documentoRef,
    rg: rgRef,
    inscricaoEstadual: ieRef,
    telefone: telefoneRef,
    cep: cepRef
  };

  const handleMaskedInput = (e, fieldName, maskFn) => {
    const inputEl = e.target;
    const raw = inputEl.value;
    const selectionStart = inputEl.selectionStart ?? raw.length;

    const digitsBeforeCaret = raw.slice(0, selectionStart).replace(/\D/g, '').length;

    const masked = maskFn(raw);

    setFormData(prev => ({
      ...prev,
      [fieldName]: masked
    }));

    const ref = refMap[fieldName];
    if (ref && ref.current) {
      requestAnimationFrame(() => {
        let newPos = 0;
        let digitsCount = 0;
        while (newPos < masked.length && digitsCount < digitsBeforeCaret) {
          if (/\d/.test(masked[newPos])) {
            digitsCount++;
          }
          newPos++;
        }
        try {
          ref.current.setSelectionRange(newPos, newPos);
        } catch {
        }
      });
    }
  };

  useEffect(() => {
    if (client) {
      setFormData({
        nome: client.name || '',
        tipoPessoa: client.tipoPessoa || 'F',
        documento:
          (client.tipoPessoa === 'J' ? mascararCNPJ : mascararCPF)(client.documento || ''),
        rg: client.rg ? mascararRG(client.rg) : '',
        inscricaoEstadual: client.inscricaoEstadual
          ? mascararInscricaoEstadual(client.inscricaoEstadual)
          : '',
        email: client.email || '',
        telefone: mascararTelefone(client.telefone || ''),
        cep: mascararCEP(client.cep || ''),
        cidade: client.cidade || '',
        uf: client.uf || '',
        logradouro: client.logradouro || '',
        bairro: client.bairro || '',
        numero: client.numero ? String(client.numero) : '',
        site: client.site || '',
        dataReferencia: client.dataReferencia
          ? client.dataReferencia.split('T')[0]
          : '',
        ativo: client.active ?? true
      });
    } else {
      setFormData({
        nome: '',
        tipoPessoa: 'F',
        documento: '',
        rg: '',
        inscricaoEstadual: '',
        email: '',
        telefone: '',
        cep: '',
        cidade: '',
        uf: '',
        logradouro: '',
        bairro: '',
        numero: '',
        site: '',
        dataReferencia: '',
        ativo: true
      });
    }
    setErrors({});
  }, [client, open]);

  useEffect(() => {
    const carregarEndereco = async () => {
      const cepLimpo = formData.cep.replace(/\D/g, '');
      if (cepLimpo.length === 8) {
        setBuscandoCep(true);
        const endereco = await buscarEnderecoPorCep(cepLimpo);
        setBuscandoCep(false);
        if (endereco) {
          setFormData((prev) => ({
            ...prev,
            logradouro: endereco.logradouro,
            bairro: endereco.bairro,
            cidade: endereco.cidade,
            uf: endereco.uf
          }));
        }
      }
    };
    carregarEndereco();
  }, [formData.cep]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    else {
      const partes = formData.nome.trim().split(/\s+/);
      if (partes.length < 2) {
        newErrors.nome = formData.tipoPessoa === 'F' 
          ? 'Informe pelo menos nome e sobrenome'
          : 'Informe a razão social completa';
      }
    }

    const docLimpo = formData.documento.replace(/\D/g, '');
    if (!docLimpo) {
      newErrors.documento = 'Documento é obrigatório';
    } else if (formData.tipoPessoa === 'F' && !validarCPF(docLimpo)) {
      newErrors.documento = 'CPF inválido';
    } else if (formData.tipoPessoa === 'J' && !validarCNPJ(docLimpo)) {
      newErrors.documento = 'CNPJ inválido';
    }

    if (!formData.dataReferencia) {
      newErrors.dataReferencia =
        formData.tipoPessoa === 'J'
          ? 'Data de inauguração é obrigatória'
          : 'Data de nascimento é obrigatória';
    } else {
      const dataSelecionada = new Date(formData.dataReferencia);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataSelecionada > hoje) {
        newErrors.dataReferencia = 'A data informada não pode ser futura';
      }
    }

    if (formData.tipoPessoa === 'F' && formData.inscricaoEstadual.trim()) {
      newErrors.inscricaoEstadual = 'Inscrição Estadual só deve ser informada para pessoa jurídica';
    }
    if (formData.tipoPessoa === 'J' && formData.rg.trim()) {
      newErrors.rg = 'RG só deve ser informado para pessoa física';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSave = {
      nome: formData.nome,
      tipoPessoa: formData.tipoPessoa,
      documento: formData.documento.replace(/\D/g, ''),
      rg:
        formData.tipoPessoa === 'F' && formData.rg
          ? formData.rg.replace(/\D/g, '')
          : null,
      inscricaoEstadual:
        formData.tipoPessoa === 'J' && formData.inscricaoEstadual
          ? formData.inscricaoEstadual.replace(/\D/g, '')
          : null,
      email: formData.email || null,
      telefone: formData.telefone.replace(/\D/g, '') || null,
      cep: formData.cep.replace(/\D/g, '') || null,
      cidade: formData.cidade || null,
      uf: formData.uf || null,
      logradouro: formData.logradouro || null,
      bairro: formData.bairro || null,
      numero: parseInt(formData.numero) || null,
      site: formData.site || null,
      dataReferencia: formData.dataReferencia || null
    };

    onSave(dataToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {client
              ? 'Edite as informações do cliente selecionado'
              : 'Preencha os dados para cadastrar um novo cliente'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h3 className="text-base font-semibold mb-3">Identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome/Razão Social <span className="text-destructive">*</span></Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex.: Maria Souza ou Empresa XYZ LTDA"
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && <p className="text-sm text-destructive">{errors.nome}</p>}
              </div>

              <div>
                <Label>Tipo de Pessoa <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.tipoPessoa}
                  onValueChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      tipoPessoa: value,
                      documento: '',
                      rg: value === 'F' ? prev.rg : '',
                      inscricaoEstadual: value === 'J' ? prev.inscricaoEstadual : '',
                      site: value === 'J' ? prev.site : ''
                    }));
                    setErrors({});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Pessoa Física (CPF)</SelectItem>
                    <SelectItem value="J">Pessoa Jurídica (CNPJ)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documento">
                  {formData.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="documento"
                  ref={documentoRef}
                  value={formData.documento}
                  onInput={(e) =>
                    handleMaskedInput(
                      e,
                      'documento',
                      formData.tipoPessoa === 'J' ? mascararCNPJ : mascararCPF
                    )
                  }
                  placeholder={formData.tipoPessoa === 'J' ? '00.000.000/0000-00' : '000.000.000-00'}
                  maxLength={formData.tipoPessoa === 'J' ? 18 : 14}
                  className={errors.documento ? 'border-destructive' : ''}
                />
                {errors.documento && <p className="text-sm text-destructive">{errors.documento}</p>}
              </div>

              <div>
                <Label htmlFor="dataReferencia">
                  {formData.tipoPessoa === 'J' ? 'Data de Inauguração' : 'Data de Nascimento'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dataReferencia"
                  type="date"
                  value={formData.dataReferencia}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataReferencia: e.target.value }))}
                  className={errors.dataReferencia ? 'border-destructive' : ''}
                />
                {errors.dataReferencia && <p className="text-sm text-destructive">{errors.dataReferencia}</p>}
              </div>

              {formData.tipoPessoa === 'F' && (
                <div>
                  <Label htmlFor="rg">RG </Label>
                  <Input
                    id="rg"
                    ref={rgRef}
                    value={formData.rg}
                    onInput={(e) => handleMaskedInput(e, 'rg', mascararRG)}
                    placeholder="00.000.000-0"
                    maxLength={12}
                    className={errors.rg ? 'border-destructive' : ''}
                  />
                  {errors.rg && <p className="text-sm text-destructive">{errors.rg}</p>}
                </div>
              )}

              {formData.tipoPessoa === 'J' && (
                <div>
                  <Label htmlFor="inscricaoEstadual">Inscrição Estadual </Label>
                  <Input
                    id="inscricaoEstadual"
                    ref={ieRef}
                    value={formData.inscricaoEstadual}
                    onInput={(e) => handleMaskedInput(e, 'inscricaoEstadual', mascararInscricaoEstadual)}
                    placeholder="Somente números"
                    maxLength={20}
                    className={errors.inscricaoEstadual ? 'border-destructive' : ''}
                  />
                  {errors.inscricaoEstadual && (
                    <p className="text-sm text-destructive">{errors.inscricaoEstadual}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="exemplo@dominio.com"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  ref={telefoneRef}
                  value={formData.telefone}
                  onInput={(e) => handleMaskedInput(e, 'telefone', mascararTelefone)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              {formData.tipoPessoa === 'J' && (
                <div className="md:col-span-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    value={formData.site}
                    onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
                    placeholder="https://www.exemplo.com.br"
                  />
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Endereço</h3>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <Label htmlFor="cep">CEP {buscandoCep && '(buscando...)'}</Label>
                <Input
                  id="cep"
                  ref={cepRef}
                  value={formData.cep}
                  onInput={(e) => handleMaskedInput(e, 'cep', mascararCEP)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
              <div className="col-span-9">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input
                  id="logradouro"
                  value={formData.logradouro}
                  onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                  placeholder="Rua, Avenida, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-3">
              <div className="col-span-10">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="numero">Nº</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 mt-3">
              <div className="col-span-10">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))
                  }
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark">
              {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}