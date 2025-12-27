import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequestUser } from '../../modules/auth/types/authenticated-request-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedRequestUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedRequestUser }>();
    if (!request.user) {
      throw new Error('CurrentUser decorator used without an authenticated request.user');
    }
    return request.user;
  },
);
