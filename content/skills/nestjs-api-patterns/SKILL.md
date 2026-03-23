---
name: nestjs-api-patterns
description: REST and GraphQL API design patterns for NestJS covering DTOs, versioning, pagination, filtering, sorting, caching, rate limiting, file uploads, and OpenAPI documentation. Use when building NestJS APIs, designing endpoints, implementing query patterns, or optimizing API performance.
version: 1.0.0
type: skill
tags: [nestjs, api, rest, graphql, typescript, openapi, pagination, caching]
category: Backend
author: agent-skills
---

# NestJS API Patterns

Production-grade REST and GraphQL API patterns for NestJS applications. Covers endpoint design through OpenAPI documentation.

## When to Apply

Reference these patterns when:
- Designing REST API endpoints and resources
- Implementing pagination, filtering, and sorting
- Building GraphQL resolvers and schemas
- Adding API versioning
- Setting up caching strategies
- Implementing rate limiting and throttling
- Handling file uploads
- Generating OpenAPI/Swagger documentation

## Guide Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | REST Endpoint Design | CRITICAL | `rest-` |
| 2 | Pagination & Filtering | CRITICAL | `pagination-` |
| 3 | DTOs & Validation | HIGH | `dto-` |
| 4 | Error Handling | HIGH | `errors-` |
| 5 | Caching | HIGH | `caching-` |
| 6 | API Versioning | MEDIUM | `versioning-` |
| 7 | Rate Limiting | MEDIUM | `rate-limiting-` |
| 8 | File Uploads | MEDIUM | `uploads-` |
| 9 | GraphQL Patterns | MEDIUM | `graphql-` |
| 10 | OpenAPI Documentation | LOW-MEDIUM | `openapi-` |

## Quick Reference

### 1. REST Endpoint Design (CRITICAL)
- `rest-resource-naming` - RESTful resource naming, HTTP methods, status codes
- `rest-response-envelope` - Consistent response envelope with metadata
- `rest-bulk-operations` - Bulk create, update, delete patterns

### 2. Pagination & Filtering (CRITICAL)
- `pagination-cursor` - Cursor-based pagination for infinite scroll
- `pagination-offset` - Offset-based pagination with total count
- `pagination-filtering` - Dynamic filtering with query params and DTOs
- `pagination-sorting` - Multi-field sorting with direction

### 3. DTOs & Validation (HIGH)
- `dto-request-response` - Separate request/response DTOs
- `dto-nested-validation` - Nested object and array validation
- `dto-partial-update` - PartialType and PickType for PATCH operations

### 4. Error Handling (HIGH)
- `errors-exception-filters` - Custom exception filters with structured errors
- `errors-business-exceptions` - Domain-specific exception classes
- `errors-validation-pipe` - Global validation pipe with error formatting

### 5. Caching (HIGH)
- `caching-interceptor` - CacheInterceptor with TTL and key strategies
- `caching-redis` - Redis caching with cache-manager
- `caching-invalidation` - Cache invalidation patterns

### 6. API Versioning (MEDIUM)
- `versioning-uri` - URI versioning (/v1/, /v2/)
- `versioning-header` - Header-based versioning with custom headers

### 7. Rate Limiting (MEDIUM)
- `rate-limiting-throttler` - @nestjs/throttler with per-route limits
- `rate-limiting-custom` - Custom rate limiting by user/IP/API key

### 8. File Uploads (MEDIUM)
- `uploads-multer` - File uploads with Multer interceptors
- `uploads-streaming` - Large file streaming and S3 integration

### 9. GraphQL Patterns (MEDIUM)
- `graphql-resolvers` - Resolver patterns with code-first approach
- `graphql-dataloader` - DataLoader for N+1 query prevention
- `graphql-subscriptions` - Real-time subscriptions with WebSocket

### 10. OpenAPI Documentation (LOW-MEDIUM)
- `openapi-decorators` - @ApiTags, @ApiOperation, @ApiResponse patterns
- `openapi-schemas` - DTO-to-schema mapping and examples

## Full Compiled Document

For the complete guide with all content expanded: `AGENTS.md`
