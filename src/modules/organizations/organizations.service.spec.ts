import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { OrganizationsRepository } from './organizations.repository';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  it('lists orgs for user', async () => {
    const repoMock: Pick<OrganizationsRepository, 'listForUser' | 'createOrganizationWithAdminMembership'> = {
      listForUser: async () => [
        { organizationId: 'o1', name: 'Org 1', role: 'ORG_ADMIN' as const },
      ],
      createOrganizationWithAdminMembership: async () => ({ organizationId: 'o1', role: 'ORG_ADMIN' as const }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: repoMock },
      ],
    }).compile();

    const service = moduleRef.get(OrganizationsService);
    const result = await service.listForUser('u1');

    expect(result).toEqual([{ organizationId: 'o1', name: 'Org 1', role: 'ORG_ADMIN' }]);
  });

  it('maps unique constraint error to BadRequestException', async () => {
    const repoMock: Pick<OrganizationsRepository, 'listForUser' | 'createOrganizationWithAdminMembership'> = {
      listForUser: async () => [],
      createOrganizationWithAdminMembership: async () => {
        throw new Prisma.PrismaClientKnownRequestError('Unique constraint', {
          code: 'P2002',
          clientVersion: '0',
        });
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: repoMock },
      ],
    }).compile();

    const service = moduleRef.get(OrganizationsService);

    await expect(service.createForUser({ name: 'Org', userId: 'u1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
