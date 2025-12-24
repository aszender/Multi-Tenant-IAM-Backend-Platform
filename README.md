# Multi-Tenant IAM Backend Platform (NestJS + PostgreSQL)

A production-quality backend portfolio project demonstrating **multi-tenancy**, **secure authentication**, and **enterprise-grade authorization** patterns using **NestJS + TypeScript**, **PostgreSQL**, and **JWT**.

This project is intentionally backend-only (no frontend) and focuses on:
- Clean modular architecture and maintainable code
- IAM concepts: users, organizations (tenants), roles, permissions boundaries
- Secure defaults: validation, error handling, least privilege
- Cloud & DevOps readiness: Docker, CI, and Vercel deployment

---

## Table of contents

- [Goals](#goals)
- [Core features](#core-features)
- [Architecture](#architecture)
- [Domain model](#domain-model)
- [Auth & RBAC flow](#auth--rbac-flow)
- [Multi-tenancy model](#multi-tenancy-model)
- [Database schema](#database-schema)
- [API endpoints (high level)](#api-endpoints-high-level)
- [Configuration](#configuration)
- [How to run locally (Docker)](#how-to-run-locally-docker)
- [How to run locally (non-Docker)](#how-to-run-locally-non-docker)
- [Migrations](#migrations)
- [Tests](#tests)
- [CI (GitHub Actions)](#ci-github-actions)
- [Deploy to Vercel](#deploy-to-vercel)
- [Security considerations](#security-considerations)
- [Project roadmap (modules)](#project-roadmap-modules)

---

## Goals

- Provide a **multi-tenant backend** where all business data is isolated by **organization**.
- Demonstrate **authentication** (register/login) and **authorization** (RBAC with org roles).
- Use a **Controller → Service → Repository** pattern with DTOs and centralized error handling.
- Be **deployable** with minimal changes to Vercel and compatible with **Supabase** or **AWS Free Tier Postgres**.

---

## Core features

1. **Organizations (tenants)**
   - An Organization is the tenant boundary.

2. **Users belong to organizations**
   - Users authenticate globally, but data access is scoped to one organization.

3. **RBAC**
   - Roles: `ORG_ADMIN`, `ORG_USER`, `READ_ONLY`.

4. **Secure authentication**
   - Register, login, JWT access token.

5. **Protected business domain: Projects**
   - Standard CRUD, scoped to organization.

6. **Tenant isolation enforcement**
   - Users can only access data within their organization.

7. **Validation and error handling**
   - DTO validation, consistent error responses, centralized exception filtering.

---

## Architecture

### High-level structure

- **Presentation layer (HTTP)**
  - NestJS controllers
  - DTOs (request/response)
  - Guards (JWT auth + RBAC)
  - Pipes (validation)

- **Application layer**
  - Services (use-cases)
  - Orchestration and business rules

- **Infrastructure layer**
  - Repositories (data access)
  - Database module (Postgres connection)
  - Migrations

### NestJS modules

- `AuthModule` — register/login, password hashing, JWT signing
- `OrganizationsModule` — tenant entities and admin operations
- `UsersModule` — user management within tenant scope
- `ProjectsModule` — protected domain
- `ConfigModule` — strongly-validated environment config
- `DatabaseModule` — Postgres + migrations

### Controller → Service → Repository

- Controllers:
  - validate incoming requests
  - map HTTP inputs to DTOs
  - return stable response DTOs

- Services:
  - enforce business invariants
  - apply authorization decisions (in cooperation with guards)
  - call repositories

- Repositories:
  - own persistence logic
  - ensure queries are tenant-scoped

### Centralized error handling

- A global exception filter provides:
  - consistent error response shape
  - safe messages (no leaking internals)
  - traceability via request correlation IDs (planned)

---

## Domain model

### Entities

- **Organization**
  - Represents a tenant.

- **User**
  - Global identity that authenticates via email/password.

- **OrganizationMembership**
  - Connects a user to an organization.
  - Stores role for that user inside that organization.

- **Project**
  - A business entity owned by an organization.

---

## Auth & RBAC flow

### Authentication (JWT)

1. Client calls `POST /auth/register` with email, password, org name (or orgId depending on endpoint choice).
2. Service:
   - hashes password (bcrypt/argon2; recommended argon2)
   - creates user
   - creates organization and membership (first user becomes `ORG_ADMIN`)
3. Client calls `POST /auth/login` with email/password.
4. Service verifies password and issues JWT:
   - `sub`: userId
   - `orgId`: active organization context
   - `roles`: derived from membership for that org

### Authorization (RBAC)

- `JwtAuthGuard`:
  - verifies JWT signature
  - attaches `request.user` (subject, orgId, roles)

- `RolesGuard`:
  - reads required roles from `@Roles(...)`
  - checks whether request user has sufficient role

### Typical protected request

1. Client sends `Authorization: Bearer <token>`.
2. JWT guard authenticates and sets `request.user`.
3. Roles guard authorizes.
4. Service executes use-case.
5. Repository executes tenant-scoped query using `orgId`.

---

## Multi-tenancy model

This project uses **organization-based multi-tenancy** (single database, shared schema), enforced by:

- **JWT includes `orgId`** representing the active tenant context.
- **All domain queries include `orgId` predicates**.
- **Guard/service checks** prevent cross-tenant access.
- **Database constraints/indexes** support tenant-scoped access patterns.

This design maps cleanly to Supabase (managed Postgres) and AWS RDS Free Tier.

---

## Database schema

> Exact SQL migrations will be provided in the migrations deliverable.

### Tables

#### `organizations`
- `id` (uuid, pk)
- `name` (text, unique per tenant naming rules)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `users`
- `id` (uuid, pk)
- `email` (citext/text, unique)
- `password_hash` (text)
- `is_active` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

#### `organization_memberships`
- `id` (uuid, pk)
- `organization_id` (uuid, fk -> organizations.id)
- `user_id` (uuid, fk -> users.id)
- `role` (enum/text: ORG_ADMIN | ORG_USER | READ_ONLY)
- `created_at` (timestamptz)

Constraints:
- unique `(organization_id, user_id)`

#### `projects`
- `id` (uuid, pk)
- `organization_id` (uuid, fk -> organizations.id)
- `name` (text)
- `description` (text, nullable)
- `created_by_user_id` (uuid, fk -> users.id)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

Indexes:
- `(organization_id, id)`
- `(organization_id, created_at)`

---

## API endpoints (high level)

### Auth
- `POST /auth/register` — create org + admin user (or join flow if enabled later)
- `POST /auth/login` — returns JWT access token
- `GET /auth/me` — returns current user + active org + role

### Organizations
- `GET /organizations` — list organizations for current user (membership-based)
- `POST /organizations` — create organization (admin only)

### Projects (tenant-scoped)
- `POST /projects` — create project (`ORG_ADMIN`/`ORG_USER`)
- `GET /projects` — list projects within org (all roles)
- `GET /projects/:id` — read a project within org (all roles)
- `PATCH /projects/:id` — update (`ORG_ADMIN`/`ORG_USER`)
- `DELETE /projects/:id` — delete (`ORG_ADMIN`)

---

## Configuration

The application uses a dedicated config module to:
- load env vars
- validate at startup
- provide strongly typed access to settings

### Example env variables

- `NODE_ENV` — `development | test | production`
- `PORT` — default 3000
- `DATABASE_URL` — Postgres connection string
- `JWT_ACCESS_SECRET` — strong secret
- `JWT_ACCESS_TTL_SECONDS` — e.g. 900

A `.env.example` file will be provided.

---

## How to run locally (Docker)

> A `docker-compose.yml` will run the API and a Postgres instance.

1. Copy env file:
   - `cp .env.example .env`
2. Start services:
   - `docker compose up --build`
3. Run migrations (command provided in repository scripts):
   - `npm run db:migrate`
4. API will be available at:
   - `http://localhost:3000`

---

## How to run locally (non-Docker)

1. Install dependencies:
   - `npm ci`
2. Start Postgres (local or Supabase) and set `DATABASE_URL`.
3. Run migrations:
   - `npm run db:migrate`
4. Start dev server:
   - `npm run start:dev`

---

## Migrations

- Database schema changes are managed via migrations.
- Migrations are designed to be deterministic and safe to run in CI and production.

Commands (to be implemented):
- `npm run db:migrate` — applies migrations
- `npm run db:rollback` — rolls back last migration (where supported)

---

## Tests

Basic automated tests will include:
- unit tests for services (auth and RBAC checks)
- integration tests for controllers with a test database

Commands:
- `npm test`
- `npm run test:e2e`

---

## CI (GitHub Actions)

CI pipeline will:
- install dependencies (`npm ci`)
- run lint/typecheck
- run tests
- optionally run migrations against a CI Postgres service

This ensures changes are safe and keeps the repository portfolio-grade.

---

## Deploy to Vercel

This API is designed to be deployable to Vercel with these constraints:

- Ensure environment variables are configured in Vercel:
  - `DATABASE_URL`
  - `JWT_ACCESS_SECRET`
  - `JWT_ACCESS_TTL_SECONDS`

- Use a managed Postgres provider:
  - Supabase Postgres (recommended)
  - AWS RDS Free Tier Postgres

- Migrations strategy:
  - run migrations as part of CI/CD before deployment, or as a controlled release step

Notes:
- Vercel serverless environments can be sensitive to connection pooling; using a provider/pooler is recommended.

---

## Security considerations

This project aims for strong security defaults:

- **Passwords**: stored as salted hashes using a modern KDF (argon2 recommended).
- **JWT secrets**: must be long and random; rotated via environment management.
- **Least privilege**: role checks enforced via guards and service-level invariants.
- **Tenant isolation**: every query is scoped by `organization_id`.
- **Input validation**: DTO validation rejects unknown/invalid fields.
- **Error handling**: centralized filter prevents leaking stack traces.
- **Auditability** (planned within scope): record `created_by_user_id` for domain entities.
- **Rate limiting** (optional if time permits): protect login endpoints.

---

## Project roadmap (modules)

We will build this repository module-by-module in this order:

1. **Project scaffold + config + database**
2. **Auth module (register/login/JWT)**
3. **Organizations + memberships**
4. **RBAC (roles decorator + guard)**
5. **Projects domain (tenant-scoped CRUD)**
6. **Migrations, tests, CI, Docker, Vercel config**

Each module will be implemented with:
- Controller → Service → Repository separation
- DTOs for all inputs/outputs
- Validation and consistent errors
- Tests for critical paths
