'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Button } from '../../../../ui/base/button';
import { Separator } from '../../../../ui/layout/separator';
import {
  User,
  Briefcase,
  Building2,
  RefreshCw,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';

export default function DialogoVisualizarColaborador({ open, onOpenChange, colaborador, aoReativar }) {
  if (!colaborador) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-brand-blue" />
            Detalhes do Colaborador
          </DialogTitle>
          <DialogDescription>
            Visualize todas as informações registradas deste colaborador
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold leading-tight">{colaborador.name}</p>
              <p className="text-muted-foreground text-sm">{colaborador.cargoNome ?? '—'}</p>
            </div>
            <Badge
              variant={colaborador.active ? 'default' : 'secondary'}
              className={colaborador.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
            >
              {colaborador.active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <Separator />

          <Section id="tour-colab-view-pessoal" icon={<User />} title="Informações pessoais">
            <Grid2>
              <Field label="CPF" value={colaborador.cpf} mono />
              <Field label="Data de nascimento" value={formatDate(colaborador.dataNascimento)} />
              <Field label="Data de admissão" value={formatDate(colaborador.dataAdmissao)} />
              <Field label="E-mail" value={colaborador.email} icon={<Mail className="h-3 w-3" />} />
              <Field label="Telefone" value={colaborador.telefone} icon={<Phone className="h-3 w-3" />} />
            </Grid2>
          </Section>

          <Section icon={<MapPin />} title="Endereço">
            <Grid2>
              <Field label="CEP" value={colaborador.cep} />
              <Field label="Cidade" value={colaborador.cidade} />
              <Field label="UF" value={colaborador.uf} />
              <Field label="Logradouro" value={colaborador.logradouro} />
              <Field label="Bairro" value={colaborador.bairro} />
              <Field label="Número" value={colaborador.numero} />
            </Grid2>
          </Section>

          <Section id="tour-colab-view-vinculos" icon={<Building2 />} title="Vínculos organizacionais">
            <Grid2>
              <Field label="Setor" value={colaborador.setorNome} />
              <Field label="Cargo" value={colaborador.cargoNome} />
            </Grid2>
          </Section>

          <Section id="tour-colab-view-sistema" icon={<Briefcase />} title="Informações do sistema">
            <Grid2>
              <Field label="ID do colaborador" value={colaborador.id} mono />
              <Field
                label="Status"
                value={colaborador.active ? 'Ativo no sistema' : 'Inativado (exclusão lógica)'}
                color={colaborador.active ? 'text-green-600' : 'text-amber-600'}
              />
            </Grid2>

            {!colaborador.active && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                Este colaborador foi desativado logicamente do sistema.
                Os registros associados (como tarefas e histórico) foram preservados.
                {aoReativar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      aoReativar(colaborador);
                      onOpenChange(false);
                    }}
                    className="mt-3 text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Reativar
                  </Button>
                )}
              </div>
            )}
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon, children, id }) {
  return (
    <div id={id}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-brand-blue">{icon}</div>}
        <h3 className="font-medium text-sm font-semibold text-base text-foreground text-muted-foreground">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, icon, mono, color }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className={`text-sm leading-tight ${mono ? 'font-mono text-xs' : ''} ${color || ''}`}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}
