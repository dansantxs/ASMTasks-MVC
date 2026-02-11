'use client';

import React, { useState, useEffect } from 'react';
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

const mascararCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

const mascararCEP = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
};

const mascararTelefone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
};

const calcularIdade = (dataNascimento) => {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
};

const getTodayDateString = () => {
  const hoje = new Date();
  const timezoneOffset = hoje.getTimezoneOffset() * 60000;
  return new Date(hoje.getTime() - timezoneOffset).toISOString().split('T')[0];
};

export default function EmployeeForm({
  open,
  onOpenChange,
  employee,
  onSave,
  setores,
  cargos
}) {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    email: '',
    telefone: '',
    cep: '',
    cidade: '',
    uf: '',
    logradouro: '',
    bairro: '',
    numero: '',
    dataNascimento: '',
    dataAdmissao: getTodayDateString(),
    setorId: '',
    cargoId: '',
    active: true
  });

  const [errors, setErrors] = useState({});
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        cpf: mascararCPF(employee.cpf || ''),
        email: employee.email || '',
        telefone: mascararTelefone(employee.telefone || ''),
        cep: mascararCEP(employee.cep || ''),
        cidade: employee.cidade || '',
        uf: employee.uf || '',
        logradouro: employee.logradouro || '',
        bairro: employee.bairro || '',
        numero: employee.numero || '',
        dataNascimento: employee.dataNascimento ? employee.dataNascimento.split('T')[0] : '',
        dataAdmissao: employee.dataAdmissao ? employee.dataAdmissao.split('T')[0] : '',
        setorId: employee.setorId ? String(employee.setorId) : '',
        cargoId: employee.cargoId ? String(employee.cargoId) : '',
        active: employee.active ?? true
      });
    } else {
      setFormData({
        name: '',
        cpf: '',
        email: '',
        telefone: '',
        cep: '',
        cidade: '',
        uf: '',
        logradouro: '',
        bairro: '',
        numero: '',
        dataNascimento: '',
        dataAdmissao: getTodayDateString(),
        setorId: '',
        cargoId: '',
        active: true
      });
    }
    setErrors({});
  }, [employee, open]);

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

    const nomes = formData.name.trim().split(/\s+/);
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (nomes.length < 2 || nomes.some(n => n.length === 0)) {
      newErrors.name = 'Digite nome e sobrenome';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido';
    }

    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    
    if (!formData.dataNascimento.trim()) {
      newErrors.dataNascimento = 'Data de nascimento é obrigatória';
    } else {
      const dataNasc = new Date(formData.dataNascimento + 'T00:00:00');
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (dataNasc >= hoje) {
        newErrors.dataNascimento = 'Data de nascimento não pode ser futura';
      } else if (calcularIdade(formData.dataNascimento) < 18) {
        newErrors.dataNascimento = 'Colaborador deve ser maior de 18 anos';
      }
    }

    const dataAdmissaoValidacao = formData.dataAdmissao || getTodayDateString();
    const dataAdm = new Date(dataAdmissaoValidacao + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (dataAdm > hoje) {
      newErrors.dataAdmissao = 'Data de admissão não pode ser futura';
    }

    if (!formData.setorId) newErrors.setorId = 'Setor é obrigatório';
    if (!formData.cargoId) newErrors.cargoId = 'Cargo é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const dataToSave = {
      ...formData,
      dataAdmissao: formData.dataAdmissao || getTodayDateString(),
      cpf: formData.cpf.replace(/\D/g, ''),
      telefone: formData.telefone.replace(/\D/g, ''),
      cep: formData.cep.replace(/\D/g, '')
    };
    
    onSave(dataToSave);
  };

  const handleCPFChange = (e) => {
    const masked = mascararCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: masked }));
  };

  const handleCEPChange = (e) => {
    const masked = mascararCEP(e.target.value);
    setFormData(prev => ({ ...prev, cep: masked }));
  };

  const handleTelefoneChange = (e) => {
    const masked = mascararTelefone(e.target.value);
    setFormData(prev => ({ ...prev, telefone: masked }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {employee ? 'Editar Colaborador' : 'Cadastrar Novo Colaborador'}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? 'Edite as informações do colaborador selecionado'
              : 'Preencha os dados para cadastrar um novo colaborador'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h3 className="text-base font-semibold mb-3">Informações pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome completo <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome completo"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="cpf">CPF <span className="text-destructive">*</span></Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.cpf ? 'border-destructive' : ''}
                />
                {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="exemplo@empresa.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={handleTelefoneChange}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Endereço</h3>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <Label htmlFor="cep">CEP {buscandoCep && '(buscando...)'}</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={handleCEPChange}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Datas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento <span className="text-destructive">*</span></Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataNascimento: e.target.value }))}
                  className={errors.dataNascimento ? 'border-destructive' : ''}
                />
                {errors.dataNascimento && <p className="text-sm text-destructive">{errors.dataNascimento}</p>}
              </div>

              <div>
                <Label htmlFor="dataAdmissao">
                  Data de Admissão {employee ? <span className="text-destructive">*</span> : '(automática no cadastro)'}
                </Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataAdmissao: e.target.value }))}
                  disabled={!employee}
                  className={errors.dataAdmissao ? 'border-destructive' : ''}
                />
                {errors.dataAdmissao && <p className="text-sm text-destructive">{errors.dataAdmissao}</p>}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Vínculos organizacionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Setor"
                value={formData.setorId}
                options={setores}
                onChange={(value) => setFormData(prev => ({ ...prev, setorId: value }))}
                error={errors.setorId}
              />
              <SelectField
                label="Cargo"
                value={formData.cargoId}
                options={cargos}
                onChange={(value) => setFormData(prev => ({ ...prev, cargoId: value }))}
                error={errors.cargoId}
              />
            </div>
          </section>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark">
              {employee ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({ label, value, options, onChange, error }) {
  return (
    <div>
      <Label>{label} <span className="text-destructive">*</span></Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={`Selecione o ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={String(opt.id)}>
              {opt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
