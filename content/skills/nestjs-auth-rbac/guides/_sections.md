# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The prefix (in parentheses) is the filename prefix used to group guides.

---

## 1. JWT Authentication (jwt)

**Impact:** CRITICAL
**Description:** Passport JWT strategy, token generation/validation/rotation, secure HTTP-only cookie transport.

## 2. Guards & Decorators (guards)

**Impact:** CRITICAL
**Description:** AuthGuard with public route bypass, RolesGuard with @Roles() decorator, guard composition with AND/OR logic.

## 3. Role-Based Access Control (rbac)

**Impact:** HIGH
**Description:** Role and permission database schema, RBAC service with role hierarchy, request-level role resolution.

## 4. Permission System (permissions)

**Impact:** HIGH
**Description:** Fine-grained permissions (create:users, read:orders), @RequirePermissions() decorator, resource ownership checks.

## 5. Refresh Tokens (refresh)

**Impact:** HIGH
**Description:** Refresh token rotation with family tracking, token revocation and blacklisting strategies.

## 6. Session Auth (session)

**Impact:** MEDIUM
**Description:** Express session with Redis store, Passport session serialization, session-based auth patterns.

## 7. OAuth2 & Social (oauth)

**Impact:** MEDIUM
**Description:** Google and GitHub OAuth2 integration, account linking for multiple providers.

## 8. Multi-Tenancy (tenant)

**Impact:** MEDIUM
**Description:** Tenant identification (subdomain, header, JWT claim), data isolation (row-level, schema-level).

## 9. Security Hardening (security)

**Impact:** MEDIUM
**Description:** Password hashing with argon2/bcrypt, brute force protection, account lockout, CSRF/CORS configuration.

## 10. Testing Auth (testing)

**Impact:** LOW-MEDIUM
**Description:** Mocking auth guards in tests, E2E testing protected endpoints with token generation.
