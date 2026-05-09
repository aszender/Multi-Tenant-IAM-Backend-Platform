import type { OrganizationRole } from '@prisma/client';

export const PERMISSIONS = {
  TENANT_READ: 'tenant:read',
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  ROLES_READ: 'roles:read',
  PERMISSIONS_READ: 'permissions:read',
  PROJECTS_READ: 'projects:read',
  PROJECTS_WRITE: 'projects:write',
  PROJECTS_DELETE: 'projects:delete',
  AUDIT_READ: 'audit:read',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  [PERMISSIONS.TENANT_READ]: 'Read active tenant metadata.',
  [PERMISSIONS.USERS_READ]: 'Read tenant users and memberships.',
  [PERMISSIONS.USERS_MANAGE]: 'Create users and manage memberships.',
  [PERMISSIONS.ROLES_READ]: 'Read tenant roles and role permissions.',
  [PERMISSIONS.PERMISSIONS_READ]: 'Read the global permission catalog.',
  [PERMISSIONS.PROJECTS_READ]: 'Read tenant-owned projects.',
  [PERMISSIONS.PROJECTS_WRITE]: 'Create and update tenant-owned projects.',
  [PERMISSIONS.PROJECTS_DELETE]: 'Delete tenant-owned projects.',
  [PERMISSIONS.AUDIT_READ]: 'Read security audit events for the active tenant.',
};

export const ROLE_PERMISSIONS: Record<OrganizationRole, readonly PermissionKey[]> = {
  ORG_ADMIN: Object.values(PERMISSIONS),
  ORG_USER: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.PERMISSIONS_READ,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_WRITE,
  ],
  READ_ONLY: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.ROLES_READ,
    PERMISSIONS.PERMISSIONS_READ,
    PERMISSIONS.PROJECTS_READ,
  ],
};

export const ROLE_LABELS: Record<OrganizationRole, string> = {
  ORG_ADMIN: 'Administrator',
  ORG_USER: 'Member',
  READ_ONLY: 'Viewer',
};

export function getPermissionsForRole(role: OrganizationRole): PermissionKey[] {
  return [...ROLE_PERMISSIONS[role]];
}
