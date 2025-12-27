import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(name: string) {
    return await this.prisma.organization.create({
      data: { name },
      select: { id: true, name: true },
    });
  }
}
