# API

Base path for application routes:

```text
/api/v1
```

Health and metrics are intentionally unprefixed for infrastructure probes.

## Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Tenant Context

- `GET /api/v1/tenants`
- `POST /api/v1/tenants`
- `GET /api/v1/organizations`
- `POST /api/v1/organizations`

## Users And Memberships

- `GET /api/v1/users`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:userId/role`
- `DELETE /api/v1/users/:userId`
- `GET /api/v1/memberships`
- `PATCH /api/v1/memberships/:userId/role`
- `DELETE /api/v1/memberships/:userId`

## RBAC

- `GET /api/v1/roles`
- `GET /api/v1/permissions`

## Tenant-Owned Projects

- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/:id`
- `PATCH /api/v1/projects/:id`
- `DELETE /api/v1/projects/:id`

## Audit

- `GET /api/v1/audit/events`

## OpenAPI

- `GET /api/v1/openapi.json`
- `GET /api/v1/docs`
