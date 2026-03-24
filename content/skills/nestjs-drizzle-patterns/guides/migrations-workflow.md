---
title: Migration Workflow
tags: migrations, drizzle-kit, workflow, versioning
---

## Migration Workflow

Use Drizzle Kit to generate and apply SQL migrations from schema changes.

### Development Workflow

```bash
# 1. Modify schema files (e.g., add a column to users.schema.ts)

# 2. Generate migration SQL
pnpm drizzle-kit generate

# Output: drizzle/0003_add_user_avatar.sql created

# 3. Review the generated SQL
# Always review before applying!

# 4. Apply migration to local database
pnpm drizzle-kit migrate

# 5. Verify with Drizzle Studio
pnpm drizzle-kit studio
```

### Production Migration

```typescript
// src/shared/database/migrate.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // single connection for migrations
  });

  const db = drizzle(pool);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');

  await pool.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

```json
// package.json
{
  "scripts": {
    "db:migrate:prod": "node dist/shared/database/migrate.js"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/deploy.yml (relevant step)
- name: Run database migrations
  run: pnpm db:migrate:prod
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Migration File Naming

```text
drizzle/
  0000_initial_schema.sql        # Auto-generated
  0001_add_posts_table.sql
  0002_add_user_avatar.sql
  0003_add_order_status_enum.sql
  meta/
    _journal.json                 # Tracks applied migrations
```

### Handling Migration Conflicts

```bash
# If two developers generate migrations simultaneously:
# 1. Both have 0003_*.sql but different content

# Solution: one developer regenerates
pnpm drizzle-kit generate
# Drizzle Kit will create 0004_*.sql with the correct diff
```

### Rules

- Always use `generate` + `migrate` for production — never `push` (which skips migration files)
- Review every generated SQL file before applying — especially `DROP` and `ALTER` statements
- Commit migration files to version control — they are the source of truth for DB state
- Run migrations before deploying new application code in CI/CD
- Use a single connection (`max: 1`) for migration runs to avoid concurrency issues
- Never manually edit migration files after they've been applied
