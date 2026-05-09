import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { RolesService } from '../roles/roles.service';

import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) {}

  async listForUser(userId: string) {
    return this.organizationsRepository.listForUser(userId);
  }

  async createForUser(params: { name: string; userId: string }) {
    try {
      const organization = await this.organizationsRepository.createOrganizationWithAdminMembership(params);
      const roles = await this.rolesService.ensureTenantDefaults(organization.organizationId);
      const adminRoleId = roles.get('ORG_ADMIN');
      if (adminRoleId) {
        await this.organizationsRepository.setAdminRoleId({
          organizationId: organization.organizationId,
          userId: params.userId,
          roleId: adminRoleId,
        });
      }
      await this.auditService.record({
        organizationId: organization.organizationId,
        actorUserId: params.userId,
        action: 'TENANT_CREATED',
        resourceType: 'organization',
        resourceId: organization.organizationId,
        metadata: { name: params.name },
      });
      return organization;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Organization name is already taken.');
      }
      throw err;
    }
  }
}
