import { RefreshTokensRepository } from './refresh-tokens.repository';

describe('RefreshTokensRepository', () => {
  it('only returns active, unexpired refresh tokens', async () => {
    const prisma = {
      refreshToken: {
        findFirst: jest.fn(async () => null),
      },
    };
    const repository = new RefreshTokensRepository(prisma as never);

    await repository.findActiveByHash('token-hash');

    expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tokenHash: 'token-hash',
          revokedAt: null,
          expiresAt: {
            gt: expect.any(Date),
          },
        }),
      }),
    );
  });

  it('revokes an old token when rotation replaces it', async () => {
    const prisma = {
      refreshToken: {
        update: jest.fn(async () => undefined),
      },
    };
    const repository = new RefreshTokensRepository(prisma as never);

    await repository.revoke({
      tokenId: 'old-token-id',
      replacedByTokenId: 'new-token-id',
    });

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'old-token-id' },
      data: {
        revokedAt: expect.any(Date),
        replacedByTokenId: 'new-token-id',
      },
    });
  });
});
