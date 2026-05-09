import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { PERMISSIONS } from '../../common/authorization/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { AuditService } from './audit.service';
import { ListAuditEventsQueryDto, ListAuditEventsResponseDto } from './dto/list-audit-events.dto';

@Controller('audit/events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  async list(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Query() query: ListAuditEventsQueryDto,
  ): Promise<ListAuditEventsResponseDto> {
    const rows = await this.auditService.listForTenant({
      organizationId: user.organizationId,
      limit: query.limit + 1,
      cursor: query.cursor,
    });

    const page = rows.slice(0, query.limit);
    return {
      events: page.map((row) => ({
        id: row.id,
        action: row.action,
        actorUserId: row.actorUserId,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: rows.length > query.limit ? page.at(-1)?.id ?? null : null,
    };
  }
}
