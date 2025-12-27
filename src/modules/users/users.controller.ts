import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { OrganizationRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { CreateUserRequestDto, CreateUserResponseDto } from './dto/create-user.dto';
import { ListUsersResponseDto } from './dto/list-users.dto';
import { UpdateUserRoleRequestDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ORG_ADMIN', 'ORG_USER')
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

  @Post()
  @Roles('ORG_ADMIN')
  async create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateUserRequestDto,
  ): Promise<CreateUserResponseDto> {
    const role: OrganizationRole = (dto.role ?? 'ORG_USER') as OrganizationRole;
    const result = await this.usersService.addUserToOrg(user, {
      email: dto.email,
      password: dto.password,
      role,
    });
    return { userId: result.userId };
  }

  @Patch(':userId/role')
  @Roles('ORG_ADMIN')
  async updateRole(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateUserRoleRequestDto,
  ) {
    return this.usersService.updateMemberRole(user, userId, dto.role as OrganizationRole);
  }

  @Delete(':userId')
  @Roles('ORG_ADMIN')
  async remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.usersService.removeMember(user, userId);
  }
}
