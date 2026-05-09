import { Injectable } from '@nestjs/common';
import { Prisma, type OrganizationRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(organizationId: string) {
    const rows = await this.prisma.organizationMembership.findMany({
      where: { organizationId },
      select: {
        createdAt: true,
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows
      .filter((r) => r.user.isActive)
      .map((r) => ({
        userId: r.user.id,
        email: r.user.email,
        role: r.role,
        joinedAt: r.createdAt,
      }));
  }

  async countAdmins(organizationId: string): Promise<number> {
    return await this.prisma.organizationMembership.count({
      where: {
        organizationId,
        role: 'ORG_ADMIN',
      },
    });
  }

  async findMembership(params: { organizationId: string; userId: string }) {
    return await this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params.organizationId,
          userId: params.userId,
        },
      },
      select: {
        role: true,
      },
    });
  }

  async createOrAttachUserToOrg(params: {
    organizationId: string;
    email: string;
    passwordHash: string;
    role: OrganizationRole;
    roleId?: string;
  }): Promise<{ userId: string }>
 {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: params.email },
      select: { id: true, isActive: true },
    });

    if (existingUser && !existingUser.isActive) {
      throw new Prisma.PrismaClientKnownRequestError('User inactive', {
        code: 'P2001',
        clientVersion: '0',
      });
    }

    return await this.prisma.$transaction(async (tx) => {
      const userId = existingUser
        ? existingUser.id
        : (
            await tx.user.create({
              data: {
                email: params.email,
                passwordHash: params.passwordHash,
              },
              select: { id: true },
            })
          ).id;

      await tx.organizationMembership.create({
        data: {
          organizationId: params.organizationId,
          userId,
          role: params.role,
          roleId: params.roleId,
        },
        select: { id: true },
      });

      return { userId };
    });
  }

  async updateRole(params: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
  }): Promise<boolean> {
    const updated = await this.prisma.organizationMembership.updateMany({
      where: {
        organizationId: params.organizationId,
        userId: params.userId,
      },
      data: { role: params.role },
    });
    return updated.count > 0;
  }

  async removeMembership(params: { organizationId: string; userId: string }): Promise<boolean> {
    const deleted = await this.prisma.organizationMembership.deleteMany({
      where: {
        organizationId: params.organizationId,
        userId: params.userId,
      },
    });

    return deleted.count > 0;
  }
}
