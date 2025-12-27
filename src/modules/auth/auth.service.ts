import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { OrganizationRole } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import { LoginRequestDto } from './dto/login.dto';
import { RegisterRequestDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { MembershipsRepository } from './repositories/memberships.repository';
import { OrganizationsRepository } from './repositories/organizations.repository';
import { UsersRepository } from './repositories/users.repository';
import type { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwordService: PasswordService,
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly membershipsRepository: MembershipsRepository,
  ) {}

  async register(dto: RegisterRequestDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const result = await this.prisma.$transaction(async () => {
      const organization = await this.organizationsRepository.create(dto.organizationName);
      const user = await this.usersRepository.create(dto.email, passwordHash);
      const membership = await this.membershipsRepository.create(
        organization.id,
        user.id,
        'ORG_ADMIN' satisfies OrganizationRole,
      );
      return { organization, user, membership };
    });

    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      orgId: result.organization.id,
      role: result.membership.role,
    };

    const accessToken = await this.jwt.signAsync(payload);

    return {
      userId: result.user.id,
      organizationId: result.organization.id,
      accessToken,
    };
  }

  async login(dto: LoginRequestDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordOk = await this.passwordService.verifyPassword(user.passwordHash, dto.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const memberships = await this.membershipsRepository.listForUser(user.id);
    if (memberships.length === 0) {
      throw new UnauthorizedException('User is not a member of any organization.');
    }

    const membership = dto.organizationId
      ? memberships.find((m) => m.organizationId === dto.organizationId)
      : memberships.length === 1
        ? memberships[0]
        : undefined;

    if (!membership) {
      throw new BadRequestException(
        memberships.length > 1
          ? 'organizationId is required because the user belongs to multiple organizations.'
          : 'User is not a member of the requested organization.',
      );
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      orgId: membership.organizationId,
      role: membership.role,
    };

    const accessToken = await this.jwt.signAsync(payload);

    return {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      accessToken,
    };
  }
}
