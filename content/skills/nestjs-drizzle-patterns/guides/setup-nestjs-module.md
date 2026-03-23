---
title: Drizzle NestJS Module Setup
tags: setup, module, provider, injection
---

## Drizzle NestJS Module Setup

Integrate Drizzle ORM into NestJS using a custom provider pattern that works with NestJS dependency injection.

### Database Module

```typescript
// shared/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { DrizzleProvider } from './drizzle.provider';

@Global()
@Module({
  providers: [DrizzleProvider],
  exports: [DrizzleProvider],
})
export class DatabaseModule {}
```

### Drizzle Provider

```typescript
// shared/database/drizzle.provider.ts
import { Provider } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = NodePgDatabase<typeof schema>;

export const DrizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.get<string>('database.url'),
      max: config.get<number>('database.poolMax', 20),
      ssl: config.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
    });

    return drizzle(pool, { schema });
  },
};
```

### Injecting Drizzle

```typescript
// modules/users/users.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '@/shared/database/drizzle.provider';
import { users } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }
}
```

### Rules

- Use `@Global()` on DatabaseModule so every module can inject Drizzle without importing
- Use a Symbol token (`DRIZZLE`) — avoids string-based injection collisions
- Export a `DrizzleDB` type alias for consistent typing across repositories
- Pass the full schema to `drizzle()` so relational queries work
- Configure the connection pool from `ConfigService`, not hardcoded values
