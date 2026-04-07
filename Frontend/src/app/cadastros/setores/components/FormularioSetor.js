'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';

export default function FormularioSetor({
  open,
  onOpenChange,
  setor,
  aoSalvar,
  setoresExistentes,
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (setor) {
      setFormData({
        name: setor.name,
        description: setor.description || '',
        active: setor.active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        active: true,
      });
    }
    setErrors({});
  }, [setor, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome e obrigatorio';
    } else {
      const nameExists = setoresExistentes.some(s =>
        s.name.toLowerCase() === formData.name.toLowerCase() &&
        s.id !== (setor && setor.id)
      );
      if (nameExists) {
        newErrors.name = 'Ja existe um setor com este nome';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    aoSalvar(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {setor ? 'Editar Setor' : 'Cadastrar Novo Setor'}
          </DialogTitle>
          <DialogDescription>
            {setor
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

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              tabIndex={-1}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-brand-blue hover:bg-brand-blue-dark"
            >
              {setor ? 'Salvar Alterações' : 'Cadastrar Setor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
