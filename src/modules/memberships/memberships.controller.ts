import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import type { OrganizationRole } from '@prisma/client';

import { PERMISSIONS } from '../../common/authorization/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';
import { ListUsersResponseDto } from '../users/dto/list-users.dto';
import { UpdateUserRoleRequestDto } from '../users/dto/update-user-role.dto';
import { UsersService } from '../users/users.service';

@Controller('memberships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  async list(@CurrentUser() user: AuthenticatedRequestUser): Promise<ListUsersResponseDto> {
    const members = await this.usersService.listMembers(user);
    return {
      members: members.map((m) => ({
        userId: m.userId,
        email: m.email,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }

  @Patch(':userId/role')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async updateRole(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateUserRoleRequestDto,
  ) {
    return this.usersService.updateMemberRole(user, userId, dto.role as OrganizationRole);
  }

  @Delete(':userId')
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.usersService.removeMember(user, userId);
  }
}
