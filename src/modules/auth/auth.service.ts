import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { OrganizationRole } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import type { Env } from '../../config/env.schema';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RolesService } from '../roles/roles.service';

import { LoginRequestDto, LogoutRequestDto, RefreshTokenRequestDto } from './dto/login.dto';
import { RegisterRequestDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { MembershipsRepository } from './repositories/memberships.repository';
import { OrganizationsRepository } from './repositories/organizations.repository';
import { RefreshTokensRepository } from './repositories/refresh-tokens.repository';
import { UsersRepository } from './repositories/users.repository';
import type { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly passwordService: PasswordService,
    private readonly usersRepository: UsersRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly membershipsRepository: MembershipsRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly rolesService: RolesService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterRequestDto) {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    const result = await this.prisma.$transaction(async () => {
      const organization = await this.organizationsRepository.create(dto.organizationName);
      const roles = await this.rolesService.ensureTenantDefaults(organization.id);
      const user = await this.usersRepository.create(dto.email, passwordHash);
      const membership = await this.membershipsRepository.create(
        organization.id,
        user.id,
        'ORG_ADMIN' satisfies OrganizationRole,
        roles.get('ORG_ADMIN'),
      );
      return { organization, user, membership };
    });

    const tokenPair = await this.issueTokenPair({
      userId: result.user.id,
      email: result.user.email,
      organizationId: result.organization.id,
      role: result.membership.role,
    });

    await this.auditService.record({
      organizationId: result.organization.id,
      actorUserId: result.user.id,
      action: 'USER_REGISTERED',
      resourceType: 'user',
      resourceId: result.user.id,
      metadata: { email: result.user.email },
    });

    return {
      userId: result.user.id,
      organizationId: result.organization.id,
      ...tokenPair,
    };
  }

  async login(dto: LoginRequestDto) {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      await this.auditService.record({
        action: 'LOGIN_FAILED',
        metadata: { email: dto.email, reason: 'invalid_user' },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    const passwordOk = await this.passwordService.verifyPassword(user.passwordHash, dto.password);
    if (!passwordOk) {
      await this.auditService.record({
        actorUserId: user.id,
        action: 'LOGIN_FAILED',
        metadata: { email: dto.email, reason: 'invalid_password' },
      });
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

    const tokenPair = await this.issueTokenPair({
      userId: user.id,
      email: user.email,
      organizationId: membership.organizationId,
      role: membership.role,
    });

    await this.auditService.record({
      organizationId: membership.organizationId,
      actorUserId: user.id,
      action: 'LOGIN_SUCCEEDED',
      resourceType: 'user',
      resourceId: user.id,
    });

    return {
      userId: user.id,
      organizationId: membership.organizationId,
      role: membership.role,
      ...tokenPair,
    };
  }

  async refresh(dto: RefreshTokenRequestDto) {
    const tokenHash = this.hashRefreshToken(dto.refreshToken);
    const existing = await this.refreshTokensRepository.findActiveByHash(tokenHash);
    if (!existing || !existing.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const membership = await this.membershipsRepository.findForUserInOrg({
      userId: existing.userId,
      organizationId: existing.organizationId,
    });
    if (!membership) {
      throw new UnauthorizedException('Refresh token tenant membership is no longer valid.');
    }

    const tokenPair = await this.issueTokenPair({
      userId: existing.user.id,
      email: existing.user.email,
      organizationId: existing.organizationId,
      role: membership.role,
    });

    await this.refreshTokensRepository.revoke({
      tokenId: existing.id,
      replacedByTokenId: tokenPair.refreshTokenId,
    });

    await this.auditService.record({
      organizationId: existing.organizationId,
      actorUserId: existing.user.id,
      action: 'REFRESH_TOKEN_ROTATED',
      resourceType: 'refresh_token',
      resourceId: existing.id,
    });

    return {
      userId: existing.user.id,
      organizationId: existing.organizationId,
      role: membership.role,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      tokenType: tokenPair.tokenType,
      expiresInSeconds: tokenPair.expiresInSeconds,
    };
  }

  async logout(dto: LogoutRequestDto) {
    const existing = await this.refreshTokensRepository.findActiveByHash(
      this.hashRefreshToken(dto.refreshToken),
    );
    if (existing) {
      await this.refreshTokensRepository.revoke({ tokenId: existing.id });
      await this.auditService.record({
        organizationId: existing.organizationId,
        actorUserId: existing.userId,
        action: 'LOGOUT',
        resourceType: 'refresh_token',
        resourceId: existing.id,
      });
    }

    return { loggedOut: true };
  }

  private async issueTokenPair(params: {
    userId: string;
    email: string;
    organizationId: string;
    role: OrganizationRole;
  }) {
    const payload: JwtPayload = {
      sub: params.userId,
      email: params.email,
      orgId: params.organizationId,
      role: params.role,
    };

    const accessTtlSeconds = this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true });
    const refreshTtlSeconds = this.config.get('JWT_REFRESH_TTL_SECONDS', { infer: true });
    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshTokenRow = await this.refreshTokensRepository.create({
      userId: params.userId,
      organizationId: params.organizationId,
      tokenHash: this.hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenId: refreshTokenRow.id,
      tokenType: 'Bearer' as const,
      expiresInSeconds: accessTtlSeconds,
    };
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
