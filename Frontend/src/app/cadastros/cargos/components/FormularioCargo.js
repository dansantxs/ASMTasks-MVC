'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';
import { toast } from 'sonner';

export default function FormularioCargo({
  open,
  onOpenChange,
  cargo,
  aoSalvar,
  cargosExistentes
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cargo) {
      setFormData({
        name: cargo.name,
        description: cargo.description || '',
        active: cargo.active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        active: true
      });
    }
    setErrors({});
  }, [cargo, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else {
      const nameExists = cargosExistentes.some(s =>
        s.name.toLowerCase() === formData.name.toLowerCase() &&
        s.id !== (cargo && cargo.id)
      );
      if (nameExists) {
        newErrors.name = 'Já existe um cargo com este nome';
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
    aoSalvar(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {cargo ? 'Editar Cargo' : 'Cadastrar Novo Cargo'}
          </DialogTitle>
          <DialogDescription>
            {cargo
              ? 'Edite as informações do cargo selecionado'
              : 'Preencha os dados para criar um novo cargo'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div id="tour-form-nome" className="space-y-2">
            <Label htmlFor="name">Nome do Cargo <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome do cargo"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div id="tour-form-descricao" className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Digite uma descrição para o cargo (opcional)"
              rows={3}
            />
          </div>

          <div id="tour-form-botoes" className="flex justify-end gap-3 pt-4">
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
              {cargo ? 'Salvar Alterações' : 'Cadastrar Cargo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
