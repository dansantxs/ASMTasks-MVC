'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/form/select';

export default function SectorForm({ 
  open, 
  onOpenChange, 
  sector, 
  onSave, 
  existingSectors,
  employees 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    responsible: '',
    responsibleName: '',
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (sector) {
      setFormData({
        name: sector.name,
        description: sector.description || '',
        responsible: sector.responsible,
        responsibleName: sector.responsibleName,
        active: sector.active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        responsible: '',
        responsibleName: '',
        active: true
      });
    }
    setErrors({});
  }, [sector, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else {
      const nameExists = existingSectors.some(s => 
        s.name.toLowerCase() === formData.name.toLowerCase() && 
        s.id !== (sector && sector.id)
      );
      if (nameExists) {
        newErrors.name = 'Já existe um setor com este nome';
      }
    }

    if (!formData.responsible) {
      newErrors.responsible = 'Responsável é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSave(formData);
  };

  const handleResponsibleChange = (value) => {
    const employee = employees.find(emp => emp.id === value);
    setFormData(prev => ({
      ...prev,
      responsible: value,
      responsibleName: employee ? employee.name : ''
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {sector ? 'Editar Setor' : 'Cadastrar Novo Setor'}
          </DialogTitle>
          <DialogDescription>
            {sector 
              ? 'Edite as informações do setor selecionado'
              : 'Preencha os dados para criar um novo setor'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Setor <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do setor"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma descrição para o setor (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsible">Responsável do Setor <span className="text-destructive">*</span></Label>
            <Select 
              value={formData.responsible} 
              onValueChange={handleResponsibleChange}
            >
              <SelectTrigger className={errors.responsible ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {employees.filter(emp => emp.active).map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.responsible && (
              <p className="text-sm text-destructive">{errors.responsible}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="bg-brand-blue hover:bg-brand-blue-dark"
            >
              {sector ? 'Salvar Alterações' : 'Cadastrar Setor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}