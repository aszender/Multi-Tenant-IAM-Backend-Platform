import { Injectable } from '@nestjs/common';

import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  constructor(private readonly rolesRepository: RolesRepository) {}

  async listForTenant(organizationId: string) {
    return await this.rolesRepository.listForTenant(organizationId);
  }

  async ensureTenantDefaults(organizationId: string) {
    return await this.rolesRepository.ensureTenantDefaults(organizationId);
  }
}
