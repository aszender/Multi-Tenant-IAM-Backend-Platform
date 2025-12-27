import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type OrganizationRole } from '@prisma/client';

import { PasswordService } from '../auth/password.service';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async listMembers(currentUser: AuthenticatedRequestUser) {
    return this.usersRepository.listMembers(currentUser.organizationId);
  }

  async addUserToOrg(
    currentUser: AuthenticatedRequestUser,
    params: { email: string; password: string; role: OrganizationRole },
  ) {
    if (currentUser.role !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only ORG_ADMIN can add users.');
    }

    const passwordHash = await this.passwordService.hashPassword(params.password);

    try {
      return await this.usersRepository.createOrAttachUserToOrg({
        organizationId: currentUser.organizationId,
        email: params.email,
        passwordHash,
        role: params.role,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          // Unique constraint (membership already exists or email exists in a conflicting way)
          throw new BadRequestException('User is already a member of this organization.');
        }
      }
      throw err;
    }
  }

  async updateMemberRole(
    currentUser: AuthenticatedRequestUser,
    targetUserId: string,
    role: OrganizationRole,
  ) {
    if (currentUser.role !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only ORG_ADMIN can change roles.');
    }

    const membership = await this.usersRepository.findMembership({
      organizationId: currentUser.organizationId,
      userId: targetUserId,
    });
    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    const isDemotingAdmin = membership.role === 'ORG_ADMIN' && role !== 'ORG_ADMIN';
    if (isDemotingAdmin) {
      const adminCount = await this.usersRepository.countAdmins(currentUser.organizationId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot demote the last ORG_ADMIN of the organization.');
      }
    }

    const updated = await this.usersRepository.updateRole({
      organizationId: currentUser.organizationId,
      userId: targetUserId,
      role,
    });

    if (!updated) {
      throw new NotFoundException('Membership not found.');
    }

    return { updated: true };
  }

  async removeMember(currentUser: AuthenticatedRequestUser, targetUserId: string) {
    if (currentUser.role !== 'ORG_ADMIN') {
      throw new ForbiddenException('Only ORG_ADMIN can remove users.');
    }

    const membership = await this.usersRepository.findMembership({
      organizationId: currentUser.organizationId,
      userId: targetUserId,
    });

    if (!membership) {
      throw new NotFoundException('Membership not found.');
    }

    if (membership.role === 'ORG_ADMIN') {
      const adminCount = await this.usersRepository.countAdmins(currentUser.organizationId);
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot remove the last ORG_ADMIN of the organization.');
      }
    }

    const deleted = await this.usersRepository.removeMembership({
      organizationId: currentUser.organizationId,
      userId: targetUserId,
    });

    if (!deleted) {
      throw new NotFoundException('Membership not found.');
    }

    return { deleted: true };
  }
}
