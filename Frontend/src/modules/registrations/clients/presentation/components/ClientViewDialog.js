'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@core/presentation/base/dialog';
import { Badge } from '@core/presentation/base/badge';
import { Separator } from '@core/presentation/ui/layout/separator';
import { User, MapPin, Mail, Phone, IdCard, Briefcase } from 'lucide-react';

export default function ClientViewDialog({ open, onOpenChange, client }) {
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-brand-blue" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Visualize as informações registradas deste cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-semibold leading-tight">{client.name}</p>
              <p className="text-muted-foreground text-sm">
                {client.tipoPessoa === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </p>
            </div>
            <Badge
              variant={client.active ? 'default' : 'secondary'}
              className={client.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
            >
              {client.active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <Separator />

          <Section icon={<IdCard />} title="Documentos">
            <Grid2>
              <Field
                label={client.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'}
                value={client.documento}
                mono
              />
              {client.tipoPessoa === 'F' && (
                <Field label="RG" value={client.rg} />
              )}
              {client.tipoPessoa === 'J' && (
                <Field label="Inscrição Estadual" value={client.inscricaoEstadual} />
              )}
            </Grid2>
          </Section>

          <Section icon={<User />} title="Contato">
            <Grid2>
              <Field label="E-mail" value={client.email} icon={<Mail className="h-3 w-3" />} />
              <Field label="Telefone" value={client.telefone} icon={<Phone className="h-3 w-3" />} />
            </Grid2>
          </Section>

          <Section icon={<MapPin />} title="Endereço">
            <Grid2>
              <Field label="CEP" value={client.cep} />
              <Field label="Cidade" value={client.cidade} />
              <Field label="UF" value={client.uf} />
              <Field label="Logradouro" value={client.logradouro} />
              <Field label="Bairro" value={client.bairro} />
              <Field label="Número" value={client.numero} />
            </Grid2>
          </Section>

          {/* ⭐ Seção extra como no exemplo dos colaboradores */}
          <Section icon={<Briefcase />} title="Informações do sistema">
            <Grid2>
              <Field label="ID do cliente" value={client.id} mono />
              <Field
                label="Status"
                value={client.active ? 'Ativo no sistema' : 'Inativado (exclusão lógica)'}
                color={client.active ? 'text-green-600' : 'text-amber-600'}
              />
            </Grid2>

            {!client.active && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                Este cliente foi desativado logicamente do sistema.
                Os registros associados (como histórico e movimentações) foram preservados.
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
        <h3 className="font-medium text-sm font-semibold text-base text-foreground text-muted-foreground">
          {title}
        </h3>
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