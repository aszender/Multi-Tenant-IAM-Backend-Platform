import { Test } from '@nestjs/testing';

import { AppController } from './app.controller';

describe('AppController', () => {
  it('returns health payload', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = moduleRef.get(AppController);
    const result = controller.health();

    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });
});
