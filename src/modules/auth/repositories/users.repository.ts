import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
      },
    });
  }

  async create(email: string, passwordHash: string) {
    return await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }
}
