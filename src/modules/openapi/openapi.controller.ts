import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class OpenApiController {
  @Get('docs')
  @Header('content-type', 'text/html; charset=utf-8')
  docs() {
    return `<!doctype html>
<html lang="en">
<head><title>Multi-Tenant IAM API</title></head>
<body>
  <h1>Multi-Tenant IAM API</h1>
  <p>OpenAPI document: <a href="/api/v1/openapi.json">/api/v1/openapi.json</a></p>
</body>
</html>`;
  }

  @Get('openapi.json')
  openApi() {
    return {
      openapi: '3.0.3',
      info: {
        title: 'Multi-Tenant IAM Backend Platform',
        version: '1.0.0',
        description:
          'Production-oriented demo API for tenant-scoped authentication, authorization, auditability, and object-level access control.',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      paths: {
        '/auth/register': { post: { summary: 'Register a user and tenant.' } },
        '/auth/login': { post: { summary: 'Login and issue access and refresh tokens.' } },
        '/auth/refresh': { post: { summary: 'Rotate a refresh token and issue a new token pair.' } },
        '/auth/logout': { post: { summary: 'Revoke a refresh token.' } },
        '/auth/me': { get: { summary: 'Return the current user, tenant context, role, and permissions.' } },
        '/tenants': { get: { summary: 'List tenant memberships.' }, post: { summary: 'Create another tenant for the current user.' } },
        '/users': { get: { summary: 'List tenant users.' }, post: { summary: 'Create or attach a tenant user.' } },
        '/memberships': { get: { summary: 'List tenant memberships.' } },
        '/roles': { get: { summary: 'List tenant roles and permissions.' } },
        '/permissions': { get: { summary: 'List the permission catalog.' } },
        '/projects': { get: { summary: 'List tenant-scoped projects.' }, post: { summary: 'Create a tenant-scoped project.' } },
        '/projects/{id}': {
          get: { summary: 'Read one tenant-scoped project.' },
          patch: { summary: 'Update one tenant-scoped project.' },
          delete: { summary: 'Delete one tenant-scoped project.' },
        },
        '/audit/events': { get: { summary: 'List tenant audit events.' } },
      },
    };
  }
}
