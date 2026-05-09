import { Injectable, Logger } from '@nestjs/common';

import { AuditRepository, type AuditRecordInput } from './audit.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  async record(input: AuditRecordInput): Promise<void> {
    try {
      await this.auditRepository.create(input);
    } catch (error) {
      this.logger.error(
        JSON.stringify({
          event: 'audit_write_failed',
          action: input.action,
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          error: error instanceof Error ? error.message : 'unknown',
        }),
      );
    }
  }

  async listForTenant(params: { organizationId: string; limit: number; cursor?: string }) {
    return await this.auditRepository.listForTenant(params);
  }
}
