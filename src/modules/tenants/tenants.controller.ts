import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';
import {
  CreateOrganizationRequestDto,
  CreateOrganizationResponseDto,
} from '../organizations/dto/create-organization.dto';
import { ListOrganizationsResponseDto } from '../organizations/dto/list-organizations.dto';
import { OrganizationsService } from '../organizations/organizations.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
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
