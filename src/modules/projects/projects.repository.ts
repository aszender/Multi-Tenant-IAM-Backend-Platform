import { Injectable } from '@nestjs/common';
import { Prisma, type Project } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

type ProjectRow = Pick<
  Project,
  'id' | 'organizationId' | 'name' | 'description' | 'createdByUserId' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    organizationId: string;
    createdByUserId: string;
    name: string;
    description?: string;
  }): Promise<ProjectRow> {
    return await this.prisma.project.create({
      data: {
        organizationId: params.organizationId,
        createdByUserId: params.createdByUserId,
        name: params.name,
        description: params.description,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async list(params: { organizationId: string }): Promise<ProjectRow[]> {
    return await this.prisma.project.findMany({
      where: { organizationId: params.organizationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(params: { organizationId: string; projectId: string }): Promise<ProjectRow | null> {
    return await this.prisma.project.findFirst({
      where: {
        id: params.projectId,
        organizationId: params.organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(params: {
    organizationId: string;
    projectId: string;
    data: Prisma.ProjectUpdateInput;
  }): Promise<ProjectRow | null> {
    const updated = await this.prisma.project.updateMany({
      where: {
        id: params.projectId,
        organizationId: params.organizationId,
      },
      data: params.data,
    });

    if (updated.count === 0) {
      return null;
    }

    return await this.findById({ organizationId: params.organizationId, projectId: params.projectId });
  }

  async delete(params: { organizationId: string; projectId: string }): Promise<boolean> {
    const deleted = await this.prisma.project.deleteMany({
      where: {
        id: params.projectId,
        organizationId: params.organizationId,
      },
    });

    return deleted.count > 0;
  }
}
