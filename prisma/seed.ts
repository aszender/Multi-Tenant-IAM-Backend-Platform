import { PrismaClient, type OrganizationRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const permissions = [
  ['tenant:read', 'Read active tenant metadata.'],
  ['users:read', 'Read tenant users and memberships.'],
  ['users:manage', 'Create users and manage memberships.'],
  ['roles:read', 'Read tenant roles and their permissions.'],
  ['permissions:read', 'Read the permission catalog.'],
  ['projects:read', 'Read tenant-owned projects.'],
  ['projects:write', 'Create and update tenant-owned projects.'],
  ['projects:delete', 'Delete tenant-owned projects.'],
  ['audit:read', 'Read security audit events for the active tenant.'],
] as const;

const rolePermissions: Record<OrganizationRole, string[]> = {
  ORG_ADMIN: permissions.map(([key]) => key),
  ORG_USER: [
    'tenant:read',
    'users:read',
    'roles:read',
    'permissions:read',
    'projects:read',
    'projects:write',
  ],
  READ_ONLY: ['tenant:read', 'roles:read', 'permissions:read', 'projects:read'],
};

const roleNames: Record<OrganizationRole, string> = {
  ORG_ADMIN: 'Administrator',
  ORG_USER: 'Member',
  READ_ONLY: 'Viewer',
};

async function seedTenant(params: {
  name: string;
  users: Array<{ email: string; password: string; role: OrganizationRole }>;
  projects: Array<{ name: string; description: string; createdByEmail: string }>;
}) {
  const organization = await prisma.organization.upsert({
    where: { name: params.name },
    update: {},
    create: { name: params.name },
  });

  const roles = new Map<OrganizationRole, string>();
  for (const role of Object.keys(rolePermissions) as OrganizationRole[]) {
    const row = await prisma.role.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: role,
        },
      },
      update: {
        name: roleNames[role],
        description: `${roleNames[role]} role for ${params.name}.`,
      },
      create: {
        organizationId: organization.id,
        key: role,
        name: roleNames[role],
        description: `${roleNames[role]} role for ${params.name}.`,
      },
    });
    roles.set(role, row.id);

    for (const permissionKey of rolePermissions[role]) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
        select: { id: true },
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: row.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: row.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const user of params.users) {
    const passwordHash = await argon2.hash(user.password);
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: { isActive: true },
      create: {
        email: user.email,
        passwordHash,
      },
    });

    await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: created.id,
        },
      },
      update: {
        role: user.role,
        roleId: roles.get(user.role),
      },
      create: {
        organizationId: organization.id,
        userId: created.id,
        role: user.role,
        roleId: roles.get(user.role),
      },
    });
  }

  for (const project of params.projects) {
    const creator = await prisma.user.findUniqueOrThrow({
      where: { email: project.createdByEmail },
      select: { id: true },
    });

    await prisma.project.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: project.name,
        },
      },
      update: {
        description: project.description,
      },
      create: {
        organizationId: organization.id,
        createdByUserId: creator.id,
        name: project.name,
        description: project.description,
      },
    });
  }

  return organization;
}

async function main() {
  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
  }

  await seedTenant({
    name: 'Acme Identity',
    users: [
      { email: 'admin@acme.test', password: 'ChangeMe123!acme', role: 'ORG_ADMIN' },
      { email: 'member@acme.test', password: 'ChangeMe123!acme', role: 'ORG_USER' },
      { email: 'viewer@acme.test', password: 'ChangeMe123!acme', role: 'READ_ONLY' },
    ],
    projects: [
      {
        name: 'Acme SCIM Connector',
        description: 'Tenant-owned integration project visible only to Acme members.',
        createdByEmail: 'admin@acme.test',
      },
    ],
  });

  await seedTenant({
    name: 'Globex Workforce',
    users: [
      { email: 'admin@globex.test', password: 'ChangeMe123!globex', role: 'ORG_ADMIN' },
      { email: 'viewer@globex.test', password: 'ChangeMe123!globex', role: 'READ_ONLY' },
    ],
    projects: [
      {
        name: 'Globex SSO Rollout',
        description: 'Separate tenant project used by tests and reviewers to verify isolation.',
        createdByEmail: 'admin@globex.test',
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
