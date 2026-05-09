import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  PERMISSION_DESCRIPTIONS,
  PERMISSIONS,
} from '../../common/authorization/permissions';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  @Get()
  @RequirePermissions(PERMISSIONS.PERMISSIONS_READ)
  list() {
    return {
      permissions: Object.entries(PERMISSION_DESCRIPTIONS).map(([key, description]) => ({
        key,
        description,
      })),
    };
  }
}
