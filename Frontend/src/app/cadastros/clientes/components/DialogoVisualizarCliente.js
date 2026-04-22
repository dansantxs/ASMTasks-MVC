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

export default function DialogoVisualizarCliente({ open, onOpenChange, cliente }) {
  if (!cliente) return null;

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
          <Card id="tour-cli-view-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{cliente.name}</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {cliente.tipoPessoa === 'J' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </p>
                </div>
                <Badge
                  variant={cliente.active ? 'default' : 'secondary'}
                  className={cliente.active ? 'bg-brand-blue hover:bg-brand-blue-dark' : ''}
                >
                  {cliente.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <InfoSection icon={<IdCard />} title="Documentos">
                <InfoGrid>
                  <InfoField
                    label={cliente.tipoPessoa === 'J' ? 'CNPJ' : 'CPF'}
                    value={cliente.documento}
                    mono
                  />
                  {cliente.tipoPessoa === 'F' && <InfoField label="RG" value={cliente.rg} />}
                  {cliente.tipoPessoa === 'J' && (
                    <InfoField label="Inscrição Estadual" value={cliente.inscricaoEstadual} />
                  )}
                  <InfoField
                    label={cliente.tipoPessoa === 'J' ? 'Data de Inauguração' : 'Data de Nascimento'}
                    value={formatDate(cliente.dataReferencia)}
                  />
                </InfoGrid>
              </InfoSection>

              <Separator />

              <InfoSection icon={<Handshake />} title="Contato">
                <InfoGrid>
                  <InfoField label="E-mail" value={cliente.email} icon={<Mail className="h-3 w-3" />} />
                  <InfoField label="Telefone" value={cliente.telefone} icon={<Phone className="h-3 w-3" />} />
                  <InfoField label="Site" value={cliente.site} icon={<Globe className="h-3 w-3" />} />
                </InfoGrid>
              </InfoSection>

              <Separator />

              <InfoSection icon={<MapPin />} title="Endereço">
                <InfoGrid>
                  <InfoField label="CEP" value={cliente.cep} />
                  <InfoField label="Cidade" value={cliente.cidade} />
                  <InfoField label="UF" value={cliente.uf} />
                  <InfoField label="Logradouro" value={cliente.logradouro} />
                  <InfoField label="Bairro" value={cliente.bairro} />
                  <InfoField label="Número" value={cliente.numero} />
                </InfoGrid>
              </InfoSection>
            </CardContent>
          </Card>

          <Card id="tour-cli-view-sistema">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-brand-blue" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoGrid>
                <InfoField label="ID do cliente" value={cliente.id} mono />
                <InfoField
                  label="Status"
                  value={cliente.active ? 'Ativo no sistema' : 'Inativado (exclusão lógica)'}
                  color={cliente.active ? 'text-green-600' : 'text-amber-600'}
                />
              </InfoGrid>

              {!cliente.active && (
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
