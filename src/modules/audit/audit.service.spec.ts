import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  it('persists audit events through the repository', async () => {
    const repository: Pick<AuditRepository, 'create'> = {
      create: jest.fn(async () => ({
        id: 'audit-event-id',
        organizationId: 'tenant-a',
        actorUserId: 'user-a',
        action: 'LOGIN_SUCCEEDED' as const,
        resourceType: 'user',
        resourceId: 'user-a',
        ipAddress: null,
        userAgent: null,
        metadata: { source: 'unit-test' },
        createdAt: new Date(),
      })),
    };
    const service = new AuditService(repository as AuditRepository);

    await service.record({
      organizationId: 'tenant-a',
      actorUserId: 'user-a',
      action: 'LOGIN_SUCCEEDED',
      resourceType: 'user',
      resourceId: 'user-a',
      metadata: { source: 'unit-test' },
    });

    expect(repository.create).toHaveBeenCalledWith({
      organizationId: 'tenant-a',
      actorUserId: 'user-a',
      action: 'LOGIN_SUCCEEDED',
      resourceType: 'user',
      resourceId: 'user-a',
      metadata: { source: 'unit-test' },
    });
  });
});
