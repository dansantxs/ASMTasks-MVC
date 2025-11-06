'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../../ui/base/dialog';
import { Button } from '../../../ui/base/button';
import { Input } from '../../../ui/form/input';
import { Label } from '../../../ui/form/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../ui/form/select';

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
    dataAdmissao: '',
    setorId: '',
    cargoId: '',
    active: true
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        cpf: employee.cpf || '',
        email: employee.email || '',
        telefone: employee.telefone || '',
        cep: employee.cep || '',
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
        dataAdmissao: '',
        setorId: '',
        cargoId: '',
        active: true
      });
    }
    setErrors({});
  }, [employee, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    if (!formData.dataNascimento.trim()) newErrors.dataNascimento = 'Data de nascimento é obrigatória';
    if (!formData.dataAdmissao.trim()) newErrors.dataAdmissao = 'Data de admissão é obrigatória';
    if (!formData.setorId) newErrors.setorId = 'Setor é obrigatório';
    if (!formData.cargoId) newErrors.cargoId = 'Cargo é obrigatório';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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

        <form onSubmit={handleSubmit} className="space-y-8">
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
                  onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
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
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-base font-semibold mb-3">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField id="cep" label="CEP" value={formData.cep} onChange={setFormData} placeholder="00000-000" />
              <InputField id="cidade" label="Cidade" value={formData.cidade} onChange={setFormData} placeholder="Ex: São Paulo" />
              <InputField id="uf" label="UF" value={formData.uf} onChange={setFormData} placeholder="SP" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
              <InputField id="logradouro" label="Logradouro" value={formData.logradouro} onChange={setFormData} placeholder="Rua, Avenida, etc." />
              <InputField id="bairro" label="Bairro" value={formData.bairro} onChange={setFormData} />
              <InputField id="numero" label="Número" value={formData.numero} onChange={setFormData} />
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
                <Label htmlFor="dataAdmissao">Data de Admissão <span className="text-destructive">*</span></Label>
                <Input
                  id="dataAdmissao"
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataAdmissao: e.target.value }))}
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

function InputField({ id, label, value, onChange, placeholder }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(prev => ({ ...prev, [id]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
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