'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';
import { toast } from 'sonner';

export default function StageForm({ 
  open, 
  onOpenChange, 
  stage, 
  onSave, 
  existingStages
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (stage) {
      setFormData({
        name: stage.name,
        description: stage.description || '',
        active: stage.active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        active: true
      });
    }
    setErrors({});
  }, [stage, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else {
      const nameExists = existingStages.some(s => 
        s.name.toLowerCase() === formData.name.toLowerCase() && 
        s.id !== (stage && stage.id)
      );
      if (nameExists) {
        newErrors.name = 'Já existe uma etapa com este nome';
      }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {stage ? 'Editar Etapa' : 'Cadastrar Nova Etapa'}
          </DialogTitle>
          <DialogDescription>
            {stage 
              ? 'Edite as informações da etapa selecionada'
              : 'Preencha os dados para criar uma nova etapa'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Etapa <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da etapa"
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
              placeholder="Digite uma descrição para a etapa (opcional)"
              rows={3}
            />
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
              {stage ? 'Salvar Alterações' : 'Cadastrar Etapa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
