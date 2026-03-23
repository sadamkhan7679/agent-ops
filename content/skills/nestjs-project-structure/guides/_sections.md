# Sections

This file defines all sections, their ordering, and descriptions.
The prefix (in parentheses) is the filename prefix used to group guides.

---

## 1. Architecture Principles (architecture)

**Description:** Core architectural decisions: module-first organization, layer separation, dependency direction, and why NestJS modules map naturally to domain boundaries.

## 2. Module Organization (modules)

**Description:** Domain module structure, feature vs domain modules, dynamic modules for configurable providers.

## 3. Layer Separation (layers)

**Description:** Controller, service, and repository layer boundaries. What belongs in each layer and how they communicate.

## 4. Shared & Common (shared)

**Description:** Cross-cutting concerns: guards, interceptors, pipes, filters in common/. Shared infrastructure modules for database, mail, logger.

## 5. DTOs & Validation (dtos)

**Description:** DTO file placement, class-validator patterns, class-transformer serialization, request/response separation.

## 6. Configuration (config)

**Description:** @nestjs/config with typed factories, environment validation, environment-specific overrides.

## 7. Naming Conventions (naming)

**Description:** File naming with NestJS suffixes (.controller.ts, .service.ts, .module.ts), class naming patterns.

## 8. Monorepo Patterns (monorepo)

**Description:** Nx and Turborepo monorepo patterns with NestJS apps and shared libraries.

## 9. Testing Structure (testing)

**Description:** Unit test co-location, E2E test organization, test database setup.

## 10. Splitting Guidelines (splitting)

**Description:** When and how to split large modules and services by responsibility.
