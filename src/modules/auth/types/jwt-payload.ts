import type { OrganizationRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  orgId: string;
  role: OrganizationRole;
};
