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

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequestUser } from '../auth/types/authenticated-request-user';

import { CreateProjectRequestDto, CreateProjectResponseDto } from './dto/create-project.dto';
import { GetProjectResponseDto } from './dto/get-project.dto';
import { ListProjectsResponseDto } from './dto/list-projects.dto';
import type { ProjectDto } from './dto/project.dto';
import { UpdateProjectRequestDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

function toProjectDto(row: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}): ProjectDto {
  return {
    projectId: row.id,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Controller('projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('ORG_ADMIN', 'ORG_USER')
  async create(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateProjectRequestDto,
  ): Promise<CreateProjectResponseDto> {
    const created = await this.projectsService.create(user, dto);
    return { projectId: created.id };
  }

  @Get()
  @Roles('ORG_ADMIN', 'ORG_USER', 'READ_ONLY')
  async list(@CurrentUser() user: AuthenticatedRequestUser): Promise<ListProjectsResponseDto> {
    const rows = await this.projectsService.list(user);
    return { projects: rows.map(toProjectDto) };
  }

  @Get(':id')
  @Roles('ORG_ADMIN', 'ORG_USER', 'READ_ONLY')
  async get(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<GetProjectResponseDto> {
    const row = await this.projectsService.getById(user, id);
    return { project: toProjectDto(row) };
  }

  @Patch(':id')
  @Roles('ORG_ADMIN', 'ORG_USER')
  async update(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateProjectRequestDto,
  ): Promise<GetProjectResponseDto> {
    const row = await this.projectsService.update(user, id, dto);
    return { project: toProjectDto(row) };
  }

  @Delete(':id')
  @Roles('ORG_ADMIN')
  async remove(
    @CurrentUser() user: AuthenticatedRequestUser,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.projectsService.delete(user, id);
  }
}
