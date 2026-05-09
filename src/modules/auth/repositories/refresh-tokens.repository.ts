import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class RefreshTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    userId: string;
    organizationId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return await this.prisma.refreshToken.create({
      data: params,
      select: {
        id: true,
      },
    });
  }

  async findActiveByHash(tokenHash: string) {
    return await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        userId: true,
        organizationId: true,
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });
  }

  async revoke(params: { tokenId: string; replacedByTokenId?: string }) {
    await this.prisma.refreshToken.update({
      where: { id: params.tokenId },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: params.replacedByTokenId,
      },
    });
  }
}
