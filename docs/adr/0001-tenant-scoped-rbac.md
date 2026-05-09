# ADR 0001: Tenant-Scoped RBAC With Explicit Permissions

## Status

Accepted.

## Context

The platform needs to show that identity and authorization decisions are evaluated inside an active tenant context. A user may have different privileges in different tenants.

## Decision

Use organization memberships as the tenant boundary and store a role per membership. Roles map to explicit permissions. Route guards require permissions, while services and repositories enforce tenant-scoped object access.

## Consequences

- Controllers do not contain business authorization logic.
- Permission checks are easy to scan at route level.
- Repository methods must accept tenant id for tenant-owned resources.
- Future custom roles can extend the role and permission tables without changing the route contract.
