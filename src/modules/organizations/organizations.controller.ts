import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { CreateOrganizationRequestDto, CreateOrganizationResponseDto } from './dto/create-organization.dto';
import { ListOrganizationsResponseDto } from './dto/list-organizations.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedRequestUser): Promise<ListOrganizationsResponseDto> {
    const organizations = await this.organizationsService.listForUser(user.userId);
    return { organizations };
  }

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateOrganizationRequestDto,
  ): Promise<CreateOrganizationResponseDto> {
    const result = await this.organizationsService.createForUser({
      name: dto.name,
      userId: user.userId,
    });

    return { organizationId: result.organizationId };
  }
}
