import { Injectable } from '@nestjs/common';
import type { OrganizationRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.organizationMembership.findMany({
      where: { userId },
      select: {
        role: true,
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      organizationId: m.organization.id,
      name: m.organization.name,
      role: m.role,
    }));
  }

  async createOrganizationWithAdminMembership(params: {
    name: string;
    userId: string;
  }): Promise<{ organizationId: string; role: OrganizationRole }> {
    const result = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: params.name },
        select: { id: true },
      });

      const membership = await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: params.userId,
          role: 'ORG_ADMIN',
        },
        select: { role: true },
      });

      return { organizationId: organization.id, role: membership.role };
    });

    return result;
  }

  async setAdminRoleId(params: { organizationId: string; userId: string; roleId: string }) {
    await this.prisma.organizationMembership.update({
      where: {
        organizationId_userId: {
          organizationId: params.organizationId,
          userId: params.userId,
        },
      },
      data: { roleId: params.roleId },
    });
  }
}
