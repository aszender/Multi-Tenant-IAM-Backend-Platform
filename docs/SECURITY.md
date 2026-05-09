# Security

This is a production-oriented demo, not a certified IAM product.

## Controls Implemented

- Argon2 password hashing.
- Password DTO policy requiring length, lowercase, uppercase, and numeric characters.
- JWT access token validation with expiration.
- Opaque refresh tokens stored as hashes and rotated on use.
- Permission-based guards instead of controller-local role logic.
- Tenant-scoped repositories for tenant-owned objects.
- Last-admin protection for role demotion and membership removal.
- Audit events for login, registration, refresh rotation, logout, membership changes, role changes, tenant creation, and project mutations.
- Safe global exception shape with correlation id.
- Basic security headers and strict DTO validation.

## Authorization Failure Behavior

Missing permissions return `403 Forbidden`. Tenant-owned objects outside the active tenant return `404 Not Found` so the API does not disclose whether the object exists in another tenant.

## Environment

Required variables are validated at startup:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_TTL_SECONDS`
- `JWT_REFRESH_TTL_SECONDS`

Never commit real secrets. `.env.example` contains only local placeholders.

## Known Gaps

- No email verification or account recovery.
- No MFA or passkeys.
- No external OIDC/SAML/SCIM providers yet.
- No distributed rate limiter.
- No managed KMS-backed secret rotation.
- No formal compliance claim.
