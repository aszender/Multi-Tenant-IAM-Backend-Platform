import type { OrganizationRole } from '@prisma/client';

import type { PermissionKey } from '../../../common/authorization/permissions';

export type AuthenticatedRequestUser = {
  userId: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
  permissions: PermissionKey[];
};
