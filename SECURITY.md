# Security Notes

This repository is a portfolio demo, not a certified IAM product and not a compliance implementation.

## Implemented Controls

- Argon2 password hashing.
- DTO validation with unknown-field rejection.
- JWT access-token validation and expiration.
- Opaque refresh tokens stored as SHA-256 hashes.
- Refresh-token rotation with old-token revocation.
- Tenant-scoped permission checks.
- Tenant-scoped repository methods for object reads, updates, and deletes.
- Last-admin protections for tenant membership changes.
- Audit events for security-sensitive actions.
- Consistent safe error responses with correlation ids.
- Basic CORS, security headers, auth rate limiting, and startup env validation.

## Security Audit

Run:

```bash
npm run security:audit
```

This command calls the npm registry and requires network access. The final local run completed successfully with `found 0 vulnerabilities`. Restricted environments may still fail with DNS or registry access errors.

## Known Gaps

- No MFA, passkeys, or step-up authentication.
- No email verification or account recovery flow.
- No external OIDC, SAML, or SCIM provider integration.
- No distributed rate limiter.
- No formal compliance claim.
