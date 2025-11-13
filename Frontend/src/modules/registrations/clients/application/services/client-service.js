import { mapClientFormToEntity, mapClientFromApi, mapClientToApiPayload } from '../mappers/client-mapper';
import { ClientHttpRepository } from '../../infrastructure/repositories/client-http.repository';

const repository = new ClientHttpRepository();

export async function loadClients() {
  const response = await repository.fetchAll();
  return response.map(mapClientFromApi);
}

export async function createClient(data) {
  const entity = mapClientFormToEntity(data);
  return repository.create(mapClientToApiPayload(entity));
}

export async function updateClient(id, data) {
  const entity = mapClientFormToEntity({ ...data, id });
  return repository.update(id, mapClientToApiPayload(entity));
}

export async function deactivateClient(id) {
  return repository.deactivate(id);
}

export async function reactivateClient(id) {
  return repository.reactivate(id);
}
