'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../../../ui/base/dialog';
import { Badge } from '../../../../ui/base/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../ui/layout/card';
import { Separator } from '../../../../ui/layout/separator';
import { Handshake, MapPin, Mail, Phone, IdCard, Briefcase, Globe } from 'lucide-react';

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : ' ');

export default function ClientViewDialog({ open, onOpenChange, client }) {
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-brand-blue" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Visualize as informações registradas deste cliente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{client.name}</CardTitle>
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
            </CardHeader>
            <CardContent className="space-y-5">
              <InfoSection icon={<IdCard />} title="Documentos">
                <InfoGrid>
                  <InfoField
                    label={client.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'}
                    value={client.documento}
                    mono
                  />
                  {client.tipoPessoa === 'F' && <InfoField label="RG" value={client.rg} />}
                  {client.tipoPessoa === 'J' && (
                    <InfoField label="Inscrição Estadual" value={client.inscricaoEstadual} />
                  )}
                  <InfoField
                    label={client.tipoPessoa === 'J' ? 'Data de Inauguração' : 'Data de Nascimento'}
                    value={formatDate(client.dataReferencia)}
                  />
                </InfoGrid>
              </InfoSection>

              <Separator />

              <InfoSection icon={<Handshake />} title="Contato">
                <InfoGrid>
                  <InfoField label="E-mail" value={client.email} icon={<Mail className="h-3 w-3" />} />
                  <InfoField label="Telefone" value={client.telefone} icon={<Phone className="h-3 w-3" />} />
                  <InfoField label="Site" value={client.site} icon={<Globe className="h-3 w-3" />} />
                </InfoGrid>
              </InfoSection>

              <Separator />

              <InfoSection icon={<MapPin />} title="Endereço">
                <InfoGrid>
                  <InfoField label="CEP" value={client.cep} />
                  <InfoField label="Cidade" value={client.cidade} />
                  <InfoField label="UF" value={client.uf} />
                  <InfoField label="Logradouro" value={client.logradouro} />
                  <InfoField label="Bairro" value={client.bairro} />
                  <InfoField label="Número" value={client.numero} />
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
              <InfoGrid>
                <InfoField label="ID do cliente" value={client.id} mono />
                <InfoField
                  label="Status"
                  value={client.active ? 'Ativo no sistema' : 'Inativado (exclusão lógica)'}
                  color={client.active ? 'text-green-600' : 'text-amber-600'}
                />
              </InfoGrid>

              {!client.active && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
                  Este cliente foi desativado logicamente do sistema.
                  Os registros associados (como histórico e movimentações) foram preservados.
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
        <h3 className="font-semibold text-sm text-foreground">
          {title}
        </h3>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoField({ label, value, icon, mono, color }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className={`text-sm leading-tight ${mono ? 'font-mono text-xs' : ''} ${color || ''}`}>
          {value ?? ' '}
        </p>
      </div>
    </div>
  );
}

function InfoGrid({ children }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>;
}
