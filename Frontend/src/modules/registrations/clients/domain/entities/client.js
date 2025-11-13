export function createClientEntity({
  id,
  name,
  document,
  personType,
  rg,
  stateRegistration,
  email,
  phone,
  isActive,
  address,
}) {
  const normalizedAddress = address ?? {};

  return Object.freeze({
    id: String(id),
    name,
    document,
    personType,
    rg,
    stateRegistration,
    email,
    phone,
    isActive: Boolean(isActive),
    address: {
      zipCode: normalizedAddress.zipCode ?? "",
      city: normalizedAddress.city ?? "",
      state: normalizedAddress.state ?? "",
      street: normalizedAddress.street ?? "",
      district: normalizedAddress.district ?? "",
      number: normalizedAddress.number ?? "",
    },
  });
}
