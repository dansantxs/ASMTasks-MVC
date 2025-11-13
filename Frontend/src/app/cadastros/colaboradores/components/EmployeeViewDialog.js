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
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
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
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{employee.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">{employee.cargoNome ?? '—'}</p>
                </div>
                <Badge
                  variant={employee.active ? 'default' : 'secondary'}
                  className={employee.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
                >
                  {employee.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <InfoSection icon={<User />} title="Informações pessoais">
                <InfoGrid>
                  <InfoField label="CPF" value={employee.cpf} mono />
                  <InfoField label="Data de nascimento" value={formatDate(employee.dataNascimento)} />
                  <InfoField label="Data de admissão" value={formatDate(employee.dataAdmissao)} />
                  <InfoField label="E-mail" value={employee.email} icon={<Mail className="h-3 w-3" />} />
                  <InfoField label="Telefone" value={employee.telefone} icon={<Phone className="h-3 w-3" />} />
                </InfoGrid>
              </InfoSection>

              <Separator />

              <InfoSection icon={<MapPin />} title="Endereço">
                <InfoGrid>
                  <InfoField label="CEP" value={employee.cep} />
                  <InfoField label="Cidade" value={employee.cidade} />
                  <InfoField label="UF" value={employee.uf} />
                  <InfoField label="Logradouro" value={employee.logradouro} />
                  <InfoField label="Bairro" value={employee.bairro} />
                  <InfoField label="Número" value={employee.numero} />
                </InfoGrid>
              </InfoSection>

              <Separator />

              <InfoSection icon={<Building2 />} title="Vínculos organizacionais">
                <InfoGrid>
                  <InfoField label="Setor" value={employee.setorNome} />
                  <InfoField label="Cargo" value={employee.cargoNome} />
                </InfoGrid>
              </InfoSection>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-brand-blue" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ID do Colaborador</p>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{employee.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={employee.active ? 'text-green-600' : 'text-amber-600'}>
                    {employee.active ? 'Colaborador ativo no sistema' : 'Colaborador inativado (exclusão lógica)'}
                  </p>
                </div>
              </div>

              {!employee.active && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <div className="flex items-start justify-between gap-4">
                    <p>
                      <strong>Colaborador Inativo:</strong> Este colaborador foi desativado logicamente do sistema. Os
                      registros associados foram preservados para manter o histórico.
                    </p>
                    {onReactivate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onReactivate(employee);
                          onOpenChange(false);
                        }}
                        className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reativar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoSection({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon && <div className="text-brand-blue">{icon}</div>}
        <h3 className="font-semibold text-base text-foreground">{title}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoField({ label, value, icon, mono }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className={`text-sm leading-tight ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}