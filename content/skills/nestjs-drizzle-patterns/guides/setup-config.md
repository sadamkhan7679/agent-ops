---
title: Drizzle Configuration
tags: setup, config, drizzle-kit, migrations
---

## Drizzle Configuration

Configure Drizzle Kit for schema management, migrations, and database introspection.

### drizzle.config.ts

```typescript
// drizzle.config.ts (project root)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

### Schema Barrel Export

```typescript
// src/shared/database/schema/index.ts
export * from './users.schema';
export * from './posts.schema';
export * from './comments.schema';
export * from './relations';
```

### Package Scripts

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/shared/database/seed.ts"
  }
}
```

### Migration Output Structure

```text
drizzle/
  0000_initial.sql
  0001_add_posts_table.sql
  0002_add_comments.sql
  meta/
    0000_snapshot.json
    0001_snapshot.json
    0002_snapshot.json
    _journal.json
```

### Programmatic Migration

```typescript
// src/shared/database/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: './drizzle' });
  await pool.end();
}

runMigrations().catch(console.error);
```

### Rules

- Keep `drizzle.config.ts` at the project root — Drizzle Kit expects it there
- Use `strict: true` to get warnings about potentially destructive changes
- Use `db:generate` + `db:migrate` for production — `db:push` is for prototyping only
- Export all schemas from a single barrel file so Drizzle Kit finds everything
- Commit the `drizzle/` migrations folder to version control
