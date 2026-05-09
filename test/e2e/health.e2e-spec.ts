import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { PrismaService } from '../../src/database/prisma.service';

import { applyTestAppConfig } from './apply-test-app-config';
import { setupE2eEnv } from './test-env';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    setupE2eEnv();

    // Import after env setup so AppConfigModule validation sees these values.
    const { AppModule } = await import('../../src/app.module');

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Health checks shouldn't require a live DB connection.
      // Module-level DB connectivity is validated in a dedicated integration run (docker/CI job).
      .overrideProvider(PrismaService)
      .useValue({
        $connect: async () => undefined,
        $disconnect: async () => undefined,
        $queryRaw: async () => [{ '?column?': 1 }],
      })
      .compile();

    app = moduleRef.createNestApplication();
    applyTestAppConfig(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health returns ok', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(typeof res.body.timestamp).toBe('string');
      });
  });

  it('GET /api/v1/openapi.json exposes API docs', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/openapi.json')
      .expect(200)
      .expect((res) => {
        expect(res.body.openapi).toBe('3.0.3');
        expect(res.body.paths['/auth/login']).toBeDefined();
      });
  });
});
