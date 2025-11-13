import {
  atualizarCliente,
  criarCliente,
  getClientes,
  inativarCliente,
  reativarCliente,
} from '../http/client-api';
import { ClientRepository } from '../../domain/repositories/client-repository';

export class ClientHttpRepository extends ClientRepository {
  async fetchAll() {
    return getClientes();
  }

  async create(data) {
    return criarCliente(data);
  }

  async update(id, data) {
    return atualizarCliente(id, data);
  }

  async deactivate(id) {
    return inativarCliente(id);
  }

  async reactivate(id) {
    return reativarCliente(id);
  }
}
