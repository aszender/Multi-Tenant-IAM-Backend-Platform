import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  async create(user: AuthenticatedRequestUser, dto: { name: string; description?: string }) {
    try {
      return await this.projectsRepository.create({
        organizationId: user.organizationId,
        createdByUserId: user.userId,
        name: dto.name,
        description: dto.description,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Project name is already taken.');
      }
      throw err;
    }
  }

  async list(user: AuthenticatedRequestUser) {
    return this.projectsRepository.list({ organizationId: user.organizationId });
  }

  async getById(user: AuthenticatedRequestUser, projectId: string) {
    const project = await this.projectsRepository.findById({
      organizationId: user.organizationId,
      projectId,
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  async update(user: AuthenticatedRequestUser, projectId: string, dto: { name?: string; description?: string | null }) {
    const project = await this.projectsRepository.update({
      organizationId: user.organizationId,
      projectId,
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  async delete(user: AuthenticatedRequestUser, projectId: string) {
    const deleted = await this.projectsRepository.delete({
      organizationId: user.organizationId,
      projectId,
    });

    if (!deleted) {
      throw new NotFoundException('Project not found.');
    }

    return { deleted: true };
  }
}
