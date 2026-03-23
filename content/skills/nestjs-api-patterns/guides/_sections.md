# Sections

This file defines all sections, their ordering, impact levels, and descriptions.
The prefix (in parentheses) is the filename prefix used to group guides.

---

## 1. REST Endpoint Design (rest)

**Impact:** CRITICAL
**Description:** RESTful resource naming, HTTP method semantics, status codes, response envelopes, and bulk operation patterns.

## 2. Pagination & Filtering (pagination)

**Impact:** CRITICAL
**Description:** Cursor-based and offset-based pagination, dynamic filtering with query DTOs, multi-field sorting.

## 3. DTOs & Validation (dto)

**Impact:** HIGH
**Description:** Separate request/response DTOs, nested validation, PartialType for PATCH, mapped types.

## 4. Error Handling (errors)

**Impact:** HIGH
**Description:** Custom exception filters, domain-specific exceptions, global validation pipe formatting.

## 5. Caching (caching)

**Impact:** HIGH
**Description:** Cache interceptors with TTL, Redis caching with cache-manager, cache invalidation strategies.

## 6. API Versioning (versioning)

**Impact:** MEDIUM
**Description:** URI versioning (/v1/, /v2/) and header-based versioning with NestJS versioning API.

## 7. Rate Limiting (rate-limiting)

**Impact:** MEDIUM
**Description:** @nestjs/throttler configuration, per-route limits, custom rate limiting by user/IP/API key.

## 8. File Uploads (uploads)

**Impact:** MEDIUM
**Description:** Multer interceptors for file uploads, large file streaming, S3 integration patterns.

## 9. GraphQL Patterns (graphql)

**Impact:** MEDIUM
**Description:** Code-first resolvers, DataLoader for N+1 prevention, real-time subscriptions.

## 10. OpenAPI Documentation (openapi)

**Impact:** LOW-MEDIUM
**Description:** @ApiTags, @ApiOperation, @ApiResponse decorators, DTO-to-schema mapping, Swagger UI setup.
