import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSIONS } from '../authorization/permissions';

import { PermissionsGuard } from './permissions.guard';

function contextWithUser(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('allows requests with all required permissions', () => {
    const reflector: Pick<Reflector, 'getAllAndOverride'> = {
      getAllAndOverride: () => [PERMISSIONS.PROJECTS_READ],
    };
    const guard = new PermissionsGuard(reflector as Reflector);

    expect(
      guard.canActivate(
        contextWithUser({
          permissions: [PERMISSIONS.PROJECTS_READ],
        }),
      ),
    ).toBe(true);
  });

  it('rejects requests missing a permission', () => {
    const reflector: Pick<Reflector, 'getAllAndOverride'> = {
      getAllAndOverride: () => [PERMISSIONS.PROJECTS_DELETE],
    };
    const guard = new PermissionsGuard(reflector as Reflector);

    expect(() =>
      guard.canActivate(
        contextWithUser({
          permissions: [PERMISSIONS.PROJECTS_READ],
        }),
      ),
    ).toThrow(ForbiddenException);
  });
});
