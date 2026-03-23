---
title: Turborepo Monorepo Structure
tags: monorepo, turborepo, workspace, packages
---

## Turborepo Monorepo Structure

Turborepo uses pnpm workspaces with a simpler, convention-based approach compared to Nx.

### Workspace Layout

```text
my-monorepo/
  apps/
    api/                      # NestJS application
      src/
        modules/
        common/
        main.ts
      package.json
      tsconfig.json
    web/                      # Frontend application
      package.json
  packages/
    config-typescript/        # Shared tsconfig presets
      nestjs.json
      react.json
      package.json
    config-eslint/            # Shared ESLint configs
      nestjs.js
      package.json
    shared-types/             # Shared TypeScript types
      src/
        user.ts
        pagination.ts
        index.ts
      package.json
    shared-validators/        # Shared validation schemas
      src/
        user.schema.ts
        index.ts
      package.json
    database/                 # Shared database package
      src/
        schema/
        drizzle.config.ts
        index.ts
      package.json
  turbo.json
  pnpm-workspace.yaml
  package.json
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

### Package References

```json
// apps/api/package.json
{
  "name": "@my-monorepo/api",
  "dependencies": {
    "@my-monorepo/shared-types": "workspace:*",
    "@my-monorepo/shared-validators": "workspace:*",
    "@my-monorepo/database": "workspace:*"
  }
}
```

```typescript
// apps/api/src/modules/users/users.service.ts
import { User } from '@my-monorepo/shared-types';
import { createUserSchema } from '@my-monorepo/shared-validators';
import { db, users } from '@my-monorepo/database';
```

### Shared Package Pattern

```json
// packages/shared-types/package.json
{
  "name": "@my-monorepo/shared-types",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --build",
    "lint": "eslint src/"
  }
}
```

```typescript
// packages/shared-types/src/index.ts
export type { User, CreateUserInput, UpdateUserInput } from './user';
export type { PaginatedResponse, PaginationParams } from './pagination';
```

### Rules

- Keep `packages/` for shared code — each package has its own `package.json` and build step
- Use `workspace:*` for internal dependencies so pnpm links them automatically
- Shared types packages should export types only — no runtime dependencies
- Use `turbo.json` task dependencies (`^build`) to ensure packages build before apps
- Keep NestJS-specific code in `apps/api` — packages should be framework-agnostic where possible
