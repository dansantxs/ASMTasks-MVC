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
import { Textarea } from '../../../../ui/form/textarea';
import { toast } from 'sonner';

export default function PriorityForm({
  open,
  onOpenChange,
  priority,
  onSave,
  existingPriorities
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#000000',
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (priority) {
      setFormData({
        name: priority.name,
        description: priority.description || '',
        color: priority.color || '#000000',
        active: priority.active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#000000',
        active: true
      });
    }
    setErrors({});
  }, [priority, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else {
      const nameExists = existingPriorities.some(
        p =>
          p.name.toLowerCase() === formData.name.toLowerCase() &&
          p.id !== (priority && priority.id)
      );
      if (nameExists) {
        newErrors.name = 'Já existe uma prioridade com este nome';
      }
    }

    if (!formData.color) {
      newErrors.color = 'Cor da Prioridade é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    onSave(formData);
  };

  const handleColorChange = e => {
    setFormData(prev => ({
      ...prev,
      color: e.target.value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {priority ? 'Editar Prioridade' : 'Cadastrar Nova Prioridade'}
          </DialogTitle>
          <DialogDescription>
            {priority
              ? 'Edite as informações da prioridade selecionada'
              : 'Preencha os dados para criar uma nova prioridade'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Prioridade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da prioridade"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma descrição para a prioridade (opcional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">
              Cor da Prioridade <span className="text-destructive">*</span>
            </Label>
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={handleColorChange}
              className={errors.color ? 'border-destructive h-10 w-16 p-1' : 'h-10 w-16 p-1'}
              style={{ padding: 0, border: errors.color ? '1px solid #dc2626' : undefined }}
            />
            {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-brand-blue hover:bg-brand-blue-dark">
              {priority ? 'Salvar Alterações' : 'Cadastrar Prioridade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
