import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';
import { ProjectsRepository } from '../../src/modules/projects/projects.repository';

import { applyTestAppConfig } from './apply-test-app-config';
import { setupE2eEnv } from './test-env';

describe('Security controls (e2e)', () => {
  let app: INestApplication;
  let jwt: JwtService;
  const projectId = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    setupE2eEnv();

    const { AppModule } = await import('../../src/app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: async () => undefined,
        $disconnect: async () => undefined,
        $queryRaw: async () => [{ '?column?': 1 }],
      })
      .overrideProvider(ProjectsRepository)
      .useValue({
        list: async () => [],
        create: async () => {
          throw new Error('not used');
        },
        findById: async (params: { organizationId: string; projectId: string }) => {
          expect(params).toEqual({ organizationId: 'tenant-a', projectId });
          return null;
        },
        update: async () => null,
        delete: async () => false,
      })
      .compile();

    app = moduleRef.createNestApplication();
    applyTestAppConfig(app);
    await app.init();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    await app?.close();
  });

  async function token(role: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY') {
    return await jwt.signAsync({
      sub: 'user-a',
      email: 'user-a@example.test',
      orgId: 'tenant-a',
      role,
    });
  }

  it('rejects invalid JWTs', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401);
  });

  it('does not expose tenant B object IDs in tenant A context', async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${await token('ORG_USER')}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toBe('Project not found.');
      });
  });

  it('blocks missing permissions before destructive project access', async () => {
    await request(app.getHttpServer())
      .delete(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${await token('READ_ONLY')}`)
      .expect(403);
  });
});
