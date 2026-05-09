# Testing

The test suite is designed around IAM risk areas instead of only happy-path controller checks.

## Commands

```bash
npm run lint
npm run test
npm run test:e2e
npm run build
```

## Current Coverage Focus

- Auth service token issuance paths.
- Permission guard allow/deny behavior.
- Tenant scoping in project service and repository methods.
- Last-admin protection for membership changes.
- Invalid JWT rejection in e2e tests.
- Missing permission rejection in e2e tests.
- Cross-tenant object id behavior returning not found.
- Health and OpenAPI endpoints.

## Test Database

CI runs PostgreSQL 16, applies Prisma migrations, and seeds two tenants. Local reviewers can run the same path with:

```bash
docker compose up -d db
npm run prisma:migrate
npm run prisma:seed
npm run test:e2e
```
