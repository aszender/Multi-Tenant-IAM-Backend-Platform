import { Injectable } from '@nestjs/common';
import type { OrganizationRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class MembershipsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, userId: string, role: OrganizationRole) {
    return await this.prisma.organizationMembership.create({
      data: { organizationId, userId, role },
      select: { id: true, organizationId: true, userId: true, role: true },
    });
  }

  async listForUser(userId: string) {
    return await this.prisma.organizationMembership.findMany({
      where: { userId },
      select: { organizationId: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
  }
}
