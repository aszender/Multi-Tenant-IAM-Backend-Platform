import { Injectable } from '@nestjs/common';
import type { AuditAction, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export type AuditRecordInput = {
  organizationId?: string;
  actorUserId?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: AuditRecordInput) {
    return await this.prisma.auditEvent.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }

  async listForTenant(params: { organizationId: string; limit: number; cursor?: string }) {
    return await this.prisma.auditEvent.findMany({
      where: { organizationId: params.organizationId },
      take: params.limit,
      ...(params.cursor
        ? {
            cursor: { id: params.cursor },
            skip: 1,
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        actorUserId: true,
        resourceType: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
      },
    });
  }
}
