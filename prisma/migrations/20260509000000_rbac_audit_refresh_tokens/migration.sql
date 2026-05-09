-- Add tenant-scoped RBAC, refresh token state, and audit events.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuditAction') THEN
    CREATE TYPE "AuditAction" AS ENUM (
      'USER_REGISTERED',
      'LOGIN_SUCCEEDED',
      'LOGIN_FAILED',
      'REFRESH_TOKEN_ROTATED',
      'LOGOUT',
      'TENANT_CREATED',
      'MEMBERSHIP_CREATED',
      'MEMBERSHIP_REMOVED',
      'ROLE_CHANGED',
      'PERMISSION_CHANGED',
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_DELETED',
      'AUTHORIZATION_DENIED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL,
  "key" "OrganizationRole" NOT NULL,
  "name" text NOT NULL,
  "description" text NULL,
  "is_system" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "roles_org_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "roles_org_key_unique" UNIQUE ("organization_id", "key")
);

CREATE INDEX IF NOT EXISTS "roles_org_id_idx" ON "roles"("organization_id");

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" text NOT NULL UNIQUE,
  "description" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("role_id", "permission_id"),
  CONSTRAINT "role_permissions_role_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
  CONSTRAINT "role_permissions_permission_fk" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

ALTER TABLE "organization_memberships"
  ADD COLUMN IF NOT EXISTS "role_id" uuid NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organization_memberships_role_fk'
  ) THEN
    ALTER TABLE "organization_memberships"
      ADD CONSTRAINT "organization_memberships_role_fk"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "organization_memberships_org_role_idx"
  ON "organization_memberships"("organization_id", "role");

CREATE TABLE IF NOT EXISTS "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz NULL,
  "replaced_by_token_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "refresh_tokens_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "refresh_tokens_org_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "refresh_tokens_user_org_idx"
  ON "refresh_tokens"("user_id", "organization_id");
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_hash_idx"
  ON "refresh_tokens"("token_hash");

CREATE TABLE IF NOT EXISTS "audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NULL,
  "actor_user_id" uuid NULL,
  "action" "AuditAction" NOT NULL,
  "resource_type" text NULL,
  "resource_id" text NULL,
  "ip_address" text NULL,
  "user_agent" text NULL,
  "metadata" jsonb NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "audit_events_org_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL,
  CONSTRAINT "audit_events_actor_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "audit_events_org_created_at_idx"
  ON "audit_events"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_events_actor_created_at_idx"
  ON "audit_events"("actor_user_id", "created_at");
CREATE INDEX IF NOT EXISTS "audit_events_action_created_at_idx"
  ON "audit_events"("action", "created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "projects_org_name_unique"
  ON "projects"("organization_id", "name");
