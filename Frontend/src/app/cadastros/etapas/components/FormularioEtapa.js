'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../../ui/base/dialog';
import { Button } from '../../../../ui/base/button';
import { Input } from '../../../../ui/form/input';
import { Label } from '../../../../ui/form/label';
import { Textarea } from '../../../../ui/form/textarea';
import { Switch } from '../../../../ui/form/switch';
import { toast } from 'sonner';

export default function FormularioEtapa({
  open,
  onOpenChange,
  etapa,
  aoSalvar,
  etapasExistentes
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    isFinalStage: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (etapa) {
      setFormData({
        name: etapa.name,
        description: etapa.description || '',
        active: etapa.active,
        isFinalStage: etapa.isFinalStage ?? false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        active: true,
        isFinalStage: false,
      });
    }
    setErrors({});
  }, [etapa, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else {
      const nameExists = etapasExistentes.some(s =>
        s.name.toLowerCase() === formData.name.toLowerCase() &&
        s.id !== (etapa && etapa.id)
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
    aoSalvar(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {etapa ? 'Editar Etapa' : 'Cadastrar Nova Etapa'}
          </DialogTitle>
          <DialogDescription>
            {etapa
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

          {(() => {
            const outraEtapaFinal = etapasExistentes.some(
              (e) => e.isFinalStage && e.id !== (etapa?.id ?? null)
            );
            const desabilitado = outraEtapaFinal && !formData.isFinalStage;
            return (
              <div className={`flex items-center justify-between rounded-lg border p-3 ${desabilitado ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-green-50 border-green-200'}`}>
                <Label htmlFor="isFinalStage" className={`text-sm font-medium cursor-pointer ${desabilitado ? 'text-gray-500' : 'text-green-800'}`}>
                  Etapa final
                </Label>
                <Switch
                  id="isFinalStage"
                  checked={formData.isFinalStage}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, isFinalStage: v }))}
                  disabled={desabilitado}
                />
              </div>
            );
          })()}

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
              {etapa ? 'Salvar Alterações' : 'Cadastrar Etapa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
