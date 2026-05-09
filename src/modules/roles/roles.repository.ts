import { Injectable } from '@nestjs/common';
import type { OrganizationRole } from '@prisma/client';

import {
  PERMISSION_DESCRIPTIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
} from '../../common/authorization/permissions';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ensureTenantDefaults(organizationId: string): Promise<Map<OrganizationRole, string>> {
    const roleIds = new Map<OrganizationRole, string>();

    for (const [key, description] of Object.entries(PERMISSION_DESCRIPTIONS)) {
      await this.prisma.permission.upsert({
        where: { key },
        update: { description },
        create: { key, description },
      });
    }

    for (const role of Object.keys(ROLE_PERMISSIONS) as OrganizationRole[]) {
      const row = await this.prisma.role.upsert({
        where: {
          organizationId_key: {
            organizationId,
            key: role,
          },
        },
        update: {
          name: ROLE_LABELS[role],
          description: `${ROLE_LABELS[role]} role for this tenant.`,
        },
        create: {
          organizationId,
          key: role,
          name: ROLE_LABELS[role],
          description: `${ROLE_LABELS[role]} role for this tenant.`,
        },
        select: { id: true },
      });

      roleIds.set(role, row.id);

      for (const permissionKey of ROLE_PERMISSIONS[role]) {
        const permission = await this.prisma.permission.findUniqueOrThrow({
          where: { key: permissionKey },
          select: { id: true },
        });

        await this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: row.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: row.id,
            permissionId: permission.id,
          },
        });
      }
    }

    return roleIds;
  }

  async listForTenant(organizationId: string) {
    await this.ensureTenantDefaults(organizationId);

    return await this.prisma.role.findMany({
      where: { organizationId },
      orderBy: { key: 'asc' },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        isSystem: true,
        permissions: {
          select: {
            permission: {
              select: {
                key: true,
                description: true,
              },
            },
          },
          orderBy: {
            permission: {
              key: 'asc',
            },
          },
        },
      },
    });
  }
}
