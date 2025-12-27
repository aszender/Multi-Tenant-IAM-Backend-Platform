import { SetMetadata } from '@nestjs/common';

export type OrganizationRole = 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: OrganizationRole[]) => SetMetadata(ROLES_KEY, roles);
