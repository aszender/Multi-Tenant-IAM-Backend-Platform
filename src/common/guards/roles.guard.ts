import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY, type OrganizationRole } from '../decorators/roles.decorator';
import type { AuthenticatedRequestUser } from '../../modules/auth/types/authenticated-request-user';

const roleRank: Record<OrganizationRole, number> = {
  ORG_ADMIN: 3,
  ORG_USER: 2,
  READ_ONLY: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<OrganizationRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    const user = request.user;
    if (!user) {
      return false;
    }

    const userRoleRank = roleRank[user.role];
    const requiredRank = Math.max(...requiredRoles.map((r) => roleRank[r]));
    return userRoleRank >= requiredRank;
  }
}
