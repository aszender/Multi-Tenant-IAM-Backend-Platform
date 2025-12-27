import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { Env } from '../../../config/env.schema';
import type { AuthenticatedRequestUser } from '../types/authenticated-request-user';
import type { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  validate(payload: JwtPayload): AuthenticatedRequestUser {
    if (!payload?.sub || !payload?.orgId || !payload?.email || !payload?.role) {
      throw new UnauthorizedException('Invalid token payload.');
    }
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.orgId,
      role: payload.role,
    };
  }
}
