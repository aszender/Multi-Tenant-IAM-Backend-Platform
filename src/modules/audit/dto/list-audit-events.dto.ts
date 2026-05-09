import { Type } from 'class-transformer';
import { IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListAuditEventsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit = 50;

  @IsOptional()
  @IsUUID('4')
  cursor?: string;
}

export class AuditEventDto {
  id!: string;
  action!: string;
  actorUserId!: string | null;
  resourceType!: string | null;
  resourceId!: string | null;
  metadata!: unknown;
  createdAt!: string;
}

export class ListAuditEventsResponseDto {
  events!: AuditEventDto[];
  nextCursor!: string | null;
}
