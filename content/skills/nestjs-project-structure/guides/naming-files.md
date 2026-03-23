---
title: File Naming Conventions
tags: naming, files, suffixes, conventions
---

## File Naming Conventions

NestJS enforces a suffix convention for generated files. Follow it consistently for all files.

### Standard Suffixes

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.module.ts` | Module definition | `users.module.ts` |
| `.controller.ts` | HTTP controller | `users.controller.ts` |
| `.service.ts` | Business logic | `users.service.ts` |
| `.repository.ts` | Data access | `users.repository.ts` |
| `.guard.ts` | Route guard | `jwt-auth.guard.ts` |
| `.interceptor.ts` | Request/response interceptor | `logging.interceptor.ts` |
| `.pipe.ts` | Validation/transformation pipe | `parse-uuid.pipe.ts` |
| `.filter.ts` | Exception filter | `all-exceptions.filter.ts` |
| `.decorator.ts` | Custom decorator | `current-user.decorator.ts` |
| `.strategy.ts` | Passport strategy | `jwt.strategy.ts` |
| `.dto.ts` | Data transfer object | `create-user.dto.ts` |
| `.entity.ts` | Domain entity | `user.entity.ts` |
| `.schema.ts` | Drizzle schema | `users.schema.ts` |
| `.spec.ts` | Unit test | `users.service.spec.ts` |
| `.e2e-spec.ts` | E2E test | `auth.e2e-spec.ts` |
| `.config.ts` | Configuration | `database.config.ts` |
| `.provider.ts` | Custom provider | `drizzle.provider.ts` |
| `.interface.ts` | TypeScript interface | `pagination.interface.ts` |

### Naming Rules

- **kebab-case** for all file names: `jwt-auth.guard.ts`, not `JwtAuthGuard.ts`
- **Singular noun** for entity-related files: `user.entity.ts`, not `users.entity.ts`
- **Plural noun** for module-level files: `users.module.ts`, `users.controller.ts`
- **Action prefix** for DTOs: `create-user.dto.ts`, `update-user.dto.ts`
- **Descriptive name** for guards/interceptors: `jwt-auth.guard.ts`, `logging.interceptor.ts`

### Anti-Patterns

```text
# BAD: PascalCase file names
UsersController.ts
JwtAuthGuard.ts

# BAD: Missing suffix
users.ts          # What is this? Service? Controller?
auth.ts

# BAD: Generic names
helpers.ts
utils.ts
common.ts
```
