import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { RolesService } from '../roles/roles.service';

import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  it('lists orgs for user', async () => {
    const repoMock: Pick<
      OrganizationsRepository,
      'listForUser' | 'createOrganizationWithAdminMembership' | 'setAdminRoleId'
    > = {
      listForUser: async () => [
        { organizationId: 'o1', name: 'Org 1', role: 'ORG_ADMIN' as const },
      ],
      createOrganizationWithAdminMembership: async () => ({ organizationId: 'o1', role: 'ORG_ADMIN' as const }),
      setAdminRoleId: async () => undefined,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: repoMock },
        { provide: RolesService, useValue: { ensureTenantDefaults: async () => new Map() } },
        { provide: AuditService, useValue: { record: async () => undefined } },
      ],
    }).compile();

    const service = moduleRef.get(OrganizationsService);
    const result = await service.listForUser('u1');

    expect(result).toEqual([{ organizationId: 'o1', name: 'Org 1', role: 'ORG_ADMIN' }]);
  });

  it('maps unique constraint error to BadRequestException', async () => {
    const repoMock: Pick<
      OrganizationsRepository,
      'listForUser' | 'createOrganizationWithAdminMembership' | 'setAdminRoleId'
    > = {
      listForUser: async () => [],
      createOrganizationWithAdminMembership: async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '0',
        });
      },
      setAdminRoleId: async () => undefined,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: repoMock },
        { provide: RolesService, useValue: { ensureTenantDefaults: async () => new Map() } },
        { provide: AuditService, useValue: { record: async () => undefined } },
      ],
    }).compile();

    const service = moduleRef.get(OrganizationsService);

    await expect(service.createForUser({ name: 'Org', userId: 'u1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
