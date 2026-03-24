---
name: nestjs-project-structure
description: Opinionated NestJS + TypeScript project structure covering module organization, layer-first architecture, monorepo patterns, and domain-driven folder conventions. Use when organizing a NestJS codebase, deciding where files should live, splitting large modules, or structuring services, controllers, repositories, DTOs, and guards.
version: 1.0.0
type: skill
tags: [nestjs, typescript, architecture, folder-structure, backend, monorepo]
category: Backend
author: agent-skills
---

# NestJS Project Structure

Use this skill for **NestJS + TypeScript** codebases when the real problem is structure, ownership, and boundaries.

This skill defines:

- where code should live in a NestJS application
- when to keep code module-local vs promote to shared
- how to split large modules and services
- how to name files consistently
- how monorepo patterns affect architecture
- how domain-driven design maps to NestJS modules

The default architecture is:

- **module-first** with **layer separation inside each module**
- with a **shared foundation** (`common/`, `shared/`, `lib/`)
- and **infrastructure modules** for cross-cutting concerns

## When to Use

Use this skill when the user asks any variation of:

- "How should I organize this NestJS app?"
- "This module/service is too large."
- "Where should this guard/interceptor/pipe/DTO live?"
- "How should we structure a NestJS monorepo?"
- "How do I make this backend architecture scalable?"

## Guide Categories

| Priority | Category | Prefix |
|----------|----------|--------|
| 1 | Architecture Principles | `architecture-` |
| 2 | Module Organization | `modules-` |
| 3 | Layer Separation | `layers-` |
| 4 | Shared & Common | `shared-` |
| 5 | DTOs & Validation | `dtos-` |
| 6 | Configuration | `config-` |
| 7 | Naming Conventions | `naming-` |
| 8 | Monorepo Patterns | `monorepo-` |
| 9 | Testing Structure | `testing-` |
| 10 | Splitting Guidelines | `splitting-` |

## Recommended Structure

```text
src/
  app.module.ts
  main.ts
  common/                     # Cross-cutting concerns
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
    constants/
  config/                     # Configuration module
    config.module.ts
    database.config.ts
    app.config.ts
    auth.config.ts
  modules/
    auth/                     # Domain module
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
        login.dto.ts
        register.dto.ts
      guards/
        jwt-auth.guard.ts
      strategies/
        jwt.strategy.ts
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      dto/
      entities/
    products/
      products.module.ts
      products.controller.ts
      products.service.ts
      products.repository.ts
      dto/
      entities/
  shared/                     # Shared utilities and helpers
    database/
      database.module.ts
      drizzle.provider.ts
    logger/
    mail/
  lib/                        # Pure utility functions
    dates/
    crypto/
    pagination/
test/
  e2e/
```

## Quick Reference

### 1. Architecture Principles
- `architecture-module-first` - Module-first with layer separation inside each module
- `architecture-dependency-rules` - Module dependency direction and circular dependency prevention

### 2. Module Organization
- `modules-domain` - Domain module structure (controller, service, repository, DTOs)
- `modules-feature-vs-domain` - When to use feature modules vs domain modules
- `modules-dynamic` - Dynamic modules for configurable providers

### 3. Layer Separation
- `layers-controller` - Controller responsibilities and boundaries
- `layers-service` - Service layer patterns and business logic
- `layers-repository` - Repository pattern for data access abstraction

### 4. Shared & Common
- `shared-common-module` - Cross-cutting guards, interceptors, pipes, filters
- `shared-utilities` - Shared modules for database, mail, logger

### 5. DTOs & Validation
- `dtos-organization` - DTO file placement, naming, and class-validator patterns
- `dtos-transformation` - class-transformer patterns and serialization

### 6. Configuration
- `config-module` - @nestjs/config with typed config factories
- `config-environments` - Environment-specific configuration and validation

### 7. Naming Conventions
- `naming-files` - File naming with NestJS suffixes (.controller.ts, .service.ts)
- `naming-classes` - Class naming and decorator conventions

### 8. Monorepo Patterns
- `monorepo-nx` - Nx monorepo with NestJS apps and shared libs
- `monorepo-turborepo` - Turborepo with shared packages

### 9. Testing Structure
- `testing-unit` - Unit test file placement and patterns
- `testing-e2e` - E2E test organization and test database setup

### 10. Splitting Guidelines
- `splitting-modules` - When and how to split large modules
- `splitting-services` - When and how to split large services

## Full Compiled Document

For the complete guide with all content expanded: [AGENTS.md](AGENTS)
