---
title: Nx Monorepo Structure
tags: monorepo, nx, workspace, libraries
---

## Nx Monorepo Structure

Nx provides integrated monorepo tooling with dependency graph analysis, affected commands, and code generators.

### Workspace Layout

```text
my-workspace/
  apps/
    api/                    # NestJS application
      src/
        app/
          app.module.ts
        main.ts
      project.json
    web/                    # Frontend application
      src/
      project.json
  libs/
    shared/
      interfaces/           # Shared TypeScript interfaces
        src/
          lib/
            user.interface.ts
            pagination.interface.ts
          index.ts
        project.json
      utils/                # Shared utility functions
        src/
        project.json
    api/
      feature-users/        # Domain feature library
        src/
          lib/
            users.module.ts
            users.controller.ts
            users.service.ts
            users.repository.ts
            dto/
            entities/
          index.ts
        project.json
      data-access-db/       # Database access library
        src/
          lib/
            database.module.ts
            drizzle.provider.ts
          index.ts
        project.json
  nx.json
  tsconfig.base.json
```

### Library Types

```text
# Nx library classification for NestJS
feature-*     → Domain modules with controllers and services
data-access-* → Database, HTTP clients, external service integrations
util-*        → Pure functions, helpers, no NestJS dependencies
shared-*      → Cross-app interfaces, DTOs, constants
```

### Generating Libraries

```bash
# Feature library
pnpm nx g @nx/nest:library feature-users --directory=libs/api/feature-users

# Shared interfaces
pnpm nx g @nx/js:library interfaces --directory=libs/shared/interfaces

# Data access library
pnpm nx g @nx/nest:library data-access-db --directory=libs/api/data-access-db
```

### Importing Across Libraries

```typescript
// tsconfig.base.json paths
{
  "compilerOptions": {
    "paths": {
      "@my-workspace/shared/interfaces": ["libs/shared/interfaces/src/index.ts"],
      "@my-workspace/api/feature-users": ["libs/api/feature-users/src/index.ts"],
      "@my-workspace/api/data-access-db": ["libs/api/data-access-db/src/index.ts"]
    }
  }
}

// Usage in app
import { UsersModule } from '@my-workspace/api/feature-users';
import { DatabaseModule } from '@my-workspace/api/data-access-db';
import { User } from '@my-workspace/shared/interfaces';
```

### Enforcing Boundaries

```json
// nx.json — project tags
// In each project.json, add tags:
// apps/api: ["scope:api", "type:app"]
// libs/api/feature-users: ["scope:api", "type:feature"]
// libs/shared/interfaces: ["scope:shared", "type:interfaces"]
```

```json
// .eslintrc.json — boundary rules
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          { "sourceTag": "type:app", "onlyDependOnLibsWithTags": ["type:feature", "type:data-access", "type:util", "type:interfaces"] },
          { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:data-access", "type:util", "type:interfaces"] },
          { "sourceTag": "type:data-access", "onlyDependOnLibsWithTags": ["type:util", "type:interfaces"] },
          { "sourceTag": "type:util", "onlyDependOnLibsWithTags": ["type:interfaces"] }
        ]
      }
    ]
  }
}
```

### Rules

- Use `feature-*` libraries for domain modules — keep `apps/api` thin (just AppModule imports)
- Enforce dependency direction: app → feature → data-access → util → interfaces
- Use `pnpm nx affected` for CI — only build/test what changed
- Barrel exports (`index.ts`) define the public API of each library — never import from internal paths
