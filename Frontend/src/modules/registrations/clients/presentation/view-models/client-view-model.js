export function buildClientViewModel(entity) {
  return {
    id: entity.id,
    name: entity.name,
    documento: entity.document,
    tipoPessoa: entity.personType,
    rg: entity.rg,
    inscricaoEstadual: entity.stateRegistration,
    email: entity.email,
    telefone: entity.phone,
    active: entity.isActive,
    cep: entity.address.zipCode,
    cidade: entity.address.city,
    uf: entity.address.state,
    logradouro: entity.address.street,
    bairro: entity.address.district,
    numero: entity.address.number,
  };
}
