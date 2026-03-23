---
name: nestjs-auth-rbac
description: Authentication and authorization deep-dive for NestJS covering JWT, sessions, refresh tokens, RBAC, permissions, guards, decorators, OAuth2, multi-tenancy, and security hardening. Use when implementing auth flows, role-based access control, permission systems, or securing NestJS APIs.
version: 1.0.0
type: skill
tags: [nestjs, auth, jwt, rbac, permissions, security, typescript, oauth]
category: Backend
author: agent-skills
---

# NestJS Auth & RBAC

Comprehensive authentication and authorization patterns for NestJS applications. From JWT basics to enterprise multi-tenant RBAC.

## When to Apply

Reference these patterns when:
- Implementing JWT authentication with refresh tokens
- Building role-based access control (RBAC)
- Implementing fine-grained permissions
- Setting up OAuth2/social login
- Securing API endpoints with guards
- Building multi-tenant authentication
- Hardening auth against common attacks

## Guide Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | JWT Authentication | CRITICAL | `jwt-` |
| 2 | Guards & Decorators | CRITICAL | `guards-` |
| 3 | Role-Based Access Control | HIGH | `rbac-` |
| 4 | Permission System | HIGH | `permissions-` |
| 5 | Refresh Tokens | HIGH | `refresh-` |
| 6 | Session Auth | MEDIUM | `session-` |
| 7 | OAuth2 & Social | MEDIUM | `oauth-` |
| 8 | Multi-Tenancy | MEDIUM | `tenant-` |
| 9 | Security Hardening | MEDIUM | `security-` |
| 10 | Testing Auth | LOW-MEDIUM | `testing-` |

## Quick Reference

### 1. JWT Authentication (CRITICAL)
- `jwt-strategy` - Passport JWT strategy with NestJS
- `jwt-token-service` - Token generation, validation, and rotation
- `jwt-cookie-transport` - Secure HTTP-only cookie transport

### 2. Guards & Decorators (CRITICAL)
- `guards-auth` - AuthGuard with public route bypass
- `guards-roles` - RolesGuard with @Roles() decorator
- `guards-composition` - Composing multiple guards with AND/OR logic

### 3. Role-Based Access Control (HIGH)
- `rbac-schema` - Role and permission database schema
- `rbac-service` - RBAC service with role hierarchy
- `rbac-middleware` - Request-level role resolution

### 4. Permission System (HIGH)
- `permissions-granular` - Fine-grained permissions (create:users, read:orders)
- `permissions-decorator` - @RequirePermissions() decorator and guard
- `permissions-resource-owner` - Resource ownership checks

### 5. Refresh Tokens (HIGH)
- `refresh-rotation` - Refresh token rotation with family tracking
- `refresh-revocation` - Token revocation and blacklisting

### 6. Session Auth (MEDIUM)
- `session-setup` - Express session with Redis store
- `session-serialization` - Passport session serialization

### 7. OAuth2 & Social (MEDIUM)
- `oauth-google` - Google OAuth2 with Passport
- `oauth-github` - GitHub OAuth2 integration
- `oauth-linking` - Account linking for multiple providers

### 8. Multi-Tenancy (MEDIUM)
- `tenant-identification` - Tenant identification (subdomain, header, JWT claim)
- `tenant-isolation` - Data isolation strategies (row-level, schema-level)

### 9. Security Hardening (MEDIUM)
- `security-password` - Password hashing with argon2/bcrypt
- `security-brute-force` - Brute force protection and account lockout
- `security-csrf-cors` - CSRF protection and CORS configuration

### 10. Testing Auth (LOW-MEDIUM)
- `testing-auth-mocks` - Mocking auth guards and strategies in tests
- `testing-auth-e2e` - E2E testing protected endpoints

## Full Compiled Document

For the complete guide with all content expanded: `AGENTS.md`
