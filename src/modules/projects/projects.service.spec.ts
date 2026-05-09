import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AuditService } from '../audit/audit.service';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  const user: AuthenticatedRequestUser = {
    userId: 'u1',
    email: 'a@b.com',
    organizationId: 'o1',
    role: 'ORG_USER',
    permissions: ['projects:read', 'projects:write'],
  };

  it('scopes list by organizationId', async () => {
    const repoMock: Pick<ProjectsRepository, 'list' | 'create' | 'findById' | 'update' | 'delete'> = {
      list: async (params) => {
        expect(params.organizationId).toBe('o1');
        return [];
      },
      create: async () => {
        throw new Error('not used');
      },
      findById: async () => null,
      update: async () => null,
      delete: async () => false,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectsRepository, useValue: repoMock },
        { provide: AuditService, useValue: { record: async () => undefined } },
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    await expect(service.list(user)).resolves.toEqual([]);
  });

  it('throws NotFoundException when getById returns null', async () => {
    const repoMock: Pick<ProjectsRepository, 'list' | 'create' | 'findById' | 'update' | 'delete'> = {
      list: async () => [],
      create: async () => {
        throw new Error('not used');
      },
      findById: async (params) => {
        expect(params.organizationId).toBe('o1');
        expect(params.projectId).toBe('p1');
        return null;
      },
      update: async () => null,
      delete: async () => false,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectsRepository, useValue: repoMock },
        { provide: AuditService, useValue: { record: async () => undefined } },
      ],
    }).compile();

    const service = moduleRef.get(ProjectsService);
    await expect(service.getById(user, 'p1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
