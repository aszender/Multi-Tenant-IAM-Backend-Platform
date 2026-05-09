import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PasswordService } from '../auth/password.service';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';
import { AuditService } from '../audit/audit.service';
import { RolesService } from '../roles/roles.service';

import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const admin: AuthenticatedRequestUser = {
    userId: 'u-admin',
    email: 'admin@x.com',
    organizationId: 'o1',
    role: 'ORG_ADMIN',
    permissions: ['users:read', 'users:manage'],
  };

  const nonAdmin: AuthenticatedRequestUser = {
    userId: 'u-user',
    email: 'user@x.com',
    organizationId: 'o1',
    role: 'ORG_USER',
    permissions: ['users:read'],
  };

  async function createService(overrides?: Partial<UsersRepository>) {
    const repoMock: UsersRepository = {
      listMembers: async () => [],
      countAdmins: async () => 1,
      findMembership: async () => ({ role: 'ORG_ADMIN' as any }),
      createOrAttachUserToOrg: async () => ({ userId: 'u-new' }),
      updateRole: async () => true,
      removeMembership: async () => true,
      ...(overrides ?? {}),
    } as unknown as UsersRepository;

    const passwordMock: Pick<PasswordService, 'hashPassword'> = {
      hashPassword: async () => 'hash',
    };
    const auditMock: Pick<AuditService, 'record'> = {
      record: async () => undefined,
    };
    const rolesMock: Pick<RolesService, 'ensureTenantDefaults'> = {
      ensureTenantDefaults: async () => new Map([['ORG_USER', 'role-user']]),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repoMock },
        { provide: PasswordService, useValue: passwordMock },
        { provide: AuditService, useValue: auditMock },
        { provide: RolesService, useValue: rolesMock },
      ],
    }).compile();

    return moduleRef.get(UsersService);
  }

  it('rejects addUserToOrg for non-admin', async () => {
    const service = await createService();
    await expect(
      service.addUserToOrg(nonAdmin, {
        email: 'new@x.com',
        password: 'long-long-password',
        role: 'ORG_USER',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('prevents demoting last admin', async () => {
    const service = await createService({
      findMembership: async () => ({ role: 'ORG_ADMIN' as any }),
      countAdmins: async () => 1,
    });

    await expect(service.updateMemberRole(admin, 'u1', 'ORG_USER')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('prevents removing last admin', async () => {
    const service = await createService({
      findMembership: async () => ({ role: 'ORG_ADMIN' as any }),
      countAdmins: async () => 1,
    });

    await expect(service.removeMember(admin, 'u1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFound when updating non-member', async () => {
    const service = await createService({
      findMembership: async () => null,
    });

    await expect(service.updateMemberRole(admin, 'u-missing', 'READ_ONLY')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
