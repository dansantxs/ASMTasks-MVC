'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';

export default function SectorForm({
  open,
  onOpenChange,
  sector,
  onSave,
  existingSectors,
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (sector) {
      setFormData({
        name: sector.name,
        description: sector.description || '',
        active: sector.active,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        active: true,
      });
    }
    setErrors({});
  }, [sector, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome e obrigatorio';
    } else {
      const nameExists = existingSectors.some(s =>
        s.name.toLowerCase() === formData.name.toLowerCase() &&
        s.id !== (sector && sector.id)
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
    onSave(formData);
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
              ? 'Edite as informacoes do setor selecionado'
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
            <Label htmlFor="description">Descricao</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma descricao para o setor (opcional)"
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
              {sector ? 'Salvar Alteracoes' : 'Cadastrar Setor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
