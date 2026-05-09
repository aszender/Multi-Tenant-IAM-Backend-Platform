import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedRequestUser } from '../../modules/auth/types/authenticated-request-user';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { PermissionKey } from '../authorization/permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionKey[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    const user = request.user;
    if (!user) {
      return false;
    }

    const granted = new Set(user.permissions);
    const allowed = requiredPermissions.every((permission) => granted.has(permission));
    if (!allowed) {
      throw new ForbiddenException('Missing required permission.');
    }

    return true;
  }
}
