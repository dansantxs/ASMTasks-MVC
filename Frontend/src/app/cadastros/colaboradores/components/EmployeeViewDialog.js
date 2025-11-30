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

export default function EmployeeViewDialog({ open, onOpenChange, employee, onReactivate }) {
  if (!employee) return null;

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
              <p className="text-xl font-semibold leading-tight">{employee.name}</p>
              <p className="text-muted-foreground text-sm">{employee.cargoNome ?? '—'}</p>
            </div>
            <Badge
              variant={employee.active ? 'default' : 'secondary'}
              className={employee.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
            >
              {employee.active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <Separator />

          <Section icon={<User />} title="Informações pessoais">
            <Grid2>
              <Field label="CPF" value={employee.cpf} mono />
              <Field label="Data de nascimento" value={formatDate(employee.dataNascimento)} />
              <Field label="Data de admissão" value={formatDate(employee.dataAdmissao)} />
              <Field label="E-mail" value={employee.email} icon={<Mail className="h-3 w-3" />} />
              <Field label="Telefone" value={employee.telefone} icon={<Phone className="h-3 w-3" />} />
            </Grid2>
          </Section>

          <Section icon={<MapPin />} title="Endereço">
            <Grid2>
              <Field label="CEP" value={employee.cep} />
              <Field label="Cidade" value={employee.cidade} />
              <Field label="UF" value={employee.uf} />
              <Field label="Logradouro" value={employee.logradouro} />
              <Field label="Bairro" value={employee.bairro} />
              <Field label="Número" value={employee.numero} />
            </Grid2>
          </Section>

          <Section icon={<Building2 />} title="Vínculos organizacionais">
            <Grid2>
              <Field label="Setor" value={employee.setorNome} />
              <Field label="Cargo" value={employee.cargoNome} />
            </Grid2>
          </Section>

          <Section icon={<Briefcase />} title="Informações do sistema">
            <Grid2>
              <Field label="ID do colaborador" value={employee.id} mono />
              <Field
                label="Status"
                value={employee.active ? 'Ativo no sistema' : 'Inativado (exclusão lógica)'}
                color={employee.active ? 'text-green-600' : 'text-amber-600'}
              />
            </Grid2>

            {!employee.active && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                Este colaborador foi desativado logicamente do sistema.
                Os registros associados (como tarefas e histórico) foram preservados.
                {onReactivate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onReactivate(employee);
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

function Section({ title, icon, children }) {
  return (
    <div>
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