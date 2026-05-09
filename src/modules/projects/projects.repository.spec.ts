import { ProjectsRepository } from './projects.repository';

describe('ProjectsRepository', () => {
  it('scopes point reads by project id and tenant id', async () => {
    const prisma = {
      project: {
        findFirst: jest.fn(async () => null),
      },
    };
    const repository = new ProjectsRepository(prisma as never);

    await repository.findById({ organizationId: 'tenant-a', projectId: 'project-b' });

    expect(prisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'project-b',
          organizationId: 'tenant-a',
        },
      }),
    );
  });

  it('scopes updates by project id and tenant id', async () => {
    const prisma = {
      project: {
        updateMany: jest.fn(async () => ({ count: 0 })),
      },
    };
    const repository = new ProjectsRepository(prisma as never);

    await expect(
      repository.update({
        organizationId: 'tenant-a',
        projectId: 'project-b',
        data: { name: 'Renamed' },
      }),
    ).resolves.toBeNull();

    expect(prisma.project.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'project-b',
        organizationId: 'tenant-a',
      },
      data: { name: 'Renamed' },
    });
  });
});
