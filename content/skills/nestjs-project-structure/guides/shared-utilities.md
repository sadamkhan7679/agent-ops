---
title: Shared Infrastructure Modules
tags: shared, database, mail, logger, infrastructure
---

## Shared Infrastructure Modules

Shared modules provide infrastructure services (database, mail, logger) that multiple domain modules depend on.

### Structure

```text
shared/
  database/
    database.module.ts          # Drizzle + connection pool setup
    drizzle.provider.ts         # DRIZZLE injection token
    schema/
      users.schema.ts
      orders.schema.ts
      products.schema.ts
      relations.ts              # All relation definitions
      index.ts                  # Re-exports all schemas
  mail/
    mail.module.ts
    mail.service.ts
    templates/
      welcome.hbs
      reset-password.hbs
  logger/
    logger.module.ts
    logger.service.ts
  cache/
    cache.module.ts
    cache.service.ts
```

### Database Module Example

```typescript
// shared/database/drizzle.provider.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.get('DATABASE_URL'),
      max: 20,
    });
    return drizzle(pool, { schema });
  },
};

// shared/database/database.module.ts
@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
```

Rules:
- Mark infrastructure modules as `@Global()` when used by most modules
- Keep Drizzle schema files in `shared/database/schema/` — one per table
- Export a barrel file (`schema/index.ts`) for clean imports
- Shared modules own their configuration but get values from ConfigModule
