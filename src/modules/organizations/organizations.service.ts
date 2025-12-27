import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { OrganizationsRepository } from './organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly organizationsRepository: OrganizationsRepository) {}

  async listForUser(userId: string) {
    return this.organizationsRepository.listForUser(userId);
  }

  async createForUser(params: { name: string; userId: string }) {
    try {
      return await this.organizationsRepository.createOrganizationWithAdminMembership(params);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Organization name is already taken.');
      }
      throw err;
    }
  }
}
