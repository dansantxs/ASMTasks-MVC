import { createClientEntity } from '../../domain/entities/client';

export function mapClientFromApi(model) {
  return createClientEntity({
    id: model.id,
    name: model.nome,
    document: model.documento,
    personType: model.tipoPessoa,
    rg: model.rg,
    stateRegistration: model.inscricaoEstadual,
    email: model.email,
    phone: model.telefone,
    isActive: model.ativo,
    address: {
      zipCode: model.cep,
      city: model.cidade,
      state: model.uf,
      street: model.logradouro,
      district: model.bairro,
      number: model.numero,
    },
  });
}

export function mapClientToApiPayload(entity) {
  return {
    nome: entity.name,
    documento: entity.document,
    tipoPessoa: entity.personType,
    rg: entity.rg,
    inscricaoEstadual: entity.stateRegistration,
    email: entity.email,
    telefone: entity.phone,
    cep: entity.address.zipCode,
    cidade: entity.address.city,
    uf: entity.address.state,
    logradouro: entity.address.street,
    bairro: entity.address.district,
    numero: entity.address.number,
  };
}

export function mapClientFormToEntity(form) {
  return createClientEntity({
    id: form.id ?? '',
    name: form.nome,
    document: form.documento,
    personType: form.tipoPessoa,
    rg: form.rg,
    stateRegistration: form.inscricaoEstadual,
    email: form.email,
    phone: form.telefone,
    isActive: form.ativo ?? true,
    address: {
      zipCode: form.cep,
      city: form.cidade,
      state: form.uf,
      street: form.logradouro,
      district: form.bairro,
      number: form.numero,
    },
  });
}
