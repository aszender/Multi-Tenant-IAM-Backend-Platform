import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RolesService } from '../roles/roles.service';

import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { MembershipsRepository } from './repositories/memberships.repository';
import { OrganizationsRepository } from './repositories/organizations.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { UsersRepository } from './repositories/users.repository';

describe('AuthService', () => {
  async function createService(overrides?: {
    findByEmail?: UsersRepository['findByEmail'];
  }) {
    const prismaMock = {
      $transaction: async (fn: () => Promise<unknown>) => fn(),
    } as unknown as PrismaService;

    const jwtMock: Pick<JwtService, 'signAsync'> = {
      signAsync: async () => 'token',
    };

    const configMock: Pick<ConfigService, 'get'> = {
      get: (key: string) => {
        if (key === 'JWT_ACCESS_TTL_SECONDS') return 900;
        if (key === 'JWT_REFRESH_TTL_SECONDS') return 604800;
        return undefined;
      },
    };

    const passwordMock: Pick<PasswordService, 'hashPassword' | 'verifyPassword'> = {
      hashPassword: async () => 'hash',
      verifyPassword: async () => true,
    };

    const usersRepoMock: Pick<UsersRepository, 'findByEmail' | 'create'> = {
      findByEmail:
        overrides?.findByEmail ??
        (async () => null),
      create: async () => ({ id: 'u1', email: 'a@b.com' }),
    };

    const orgRepoMock: Pick<OrganizationsRepository, 'create'> = {
      create: async () => ({ id: 'o1', name: 'Org' }),
    };

    const membershipsRepoMock: Pick<MembershipsRepository, 'create' | 'listForUser'> = {
      create: async () => ({
        id: 'm1',
        organizationId: 'o1',
        userId: 'u1',
        role: 'ORG_ADMIN' as const,
      }),
      listForUser: async () => [{ organizationId: 'o1', role: 'ORG_ADMIN' as const }],
    };

    const refreshTokensRepoMock: Pick<
      RefreshTokensRepository,
      'create' | 'findActiveByHash' | 'revoke'
    > = {
      create: async () => ({ id: 'rt1' }),
      findActiveByHash: async () => null,
      revoke: async () => undefined,
    };

    const rolesMock: Pick<RolesService, 'ensureTenantDefaults'> = {
      ensureTenantDefaults: async () => new Map([['ORG_ADMIN', 'role-admin']]),
    };

    const auditMock: Pick<AuditService, 'record'> = {
      record: async () => undefined,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
        { provide: PasswordService, useValue: passwordMock },
        { provide: UsersRepository, useValue: usersRepoMock },
        { provide: OrganizationsRepository, useValue: orgRepoMock },
        { provide: MembershipsRepository, useValue: membershipsRepoMock },
        { provide: RefreshTokensRepository, useValue: refreshTokensRepoMock },
        { provide: RolesService, useValue: rolesMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    return moduleRef.get(AuthService);
  }

  it('register returns token + ids', async () => {
    const service = await createService();
    const result = await service.register({
      email: 'a@b.com',
      password: 'long-enough-password',
      organizationName: 'Org',
    });

    expect(result.userId).toBe('u1');
    expect(result.organizationId).toBe('o1');
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.expiresInSeconds).toBe(900);
  });

  it('login returns token + org role', async () => {
    const service = await createService({
      findByEmail: async () => ({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'hash',
        isActive: true,
      }),
    });

    const result = await service.login({
      email: 'a@b.com',
      password: 'pw',
    });

    expect(result.userId).toBe('u1');
    expect(result.organizationId).toBe('o1');
    expect(result.role).toBe('ORG_ADMIN');
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toEqual(expect.any(String));
  });
});
