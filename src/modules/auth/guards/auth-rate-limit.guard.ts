import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from '@nestjs/common';
import type { Request } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;
const buckets = new Map<string, Bucket>();

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket.remoteAddress || 'unknown';
    const key = `${ip}:${request.path}`;
    const now = Date.now();
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }

    existing.count += 1;
    if (existing.count > MAX_ATTEMPTS) {
      throw new TooManyRequestsException('Too many authentication attempts. Try again later.');
    }

    return true;
  }
}
