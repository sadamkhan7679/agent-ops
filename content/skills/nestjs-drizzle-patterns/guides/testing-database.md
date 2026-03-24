---
title: Database Testing Setup
tags: testing, database, test-containers, setup
---

## Database Testing Setup

Test against a real PostgreSQL instance for accurate integration tests.

### Test Database Configuration

```typescript
// test/helpers/test-database.ts
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../../src/shared/database/schema';

let pool: Pool;
let db: NodePgDatabase<typeof schema>;

export async function setupTestDatabase() {
  pool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/app_test',
    max: 5,
  });

  db = drizzle(pool, { schema });

  // Run migrations
  await migrate(db, { migrationsFolder: './drizzle' });

  return db;
}

export function getTestDb() {
  return db;
}

export async function teardownTestDatabase() {
  await pool.end();
}
```

### Jest Global Setup

```typescript
// test/setup.ts
import { setupTestDatabase, teardownTestDatabase } from './helpers/test-database';
import { sql } from 'drizzle-orm';

let db: ReturnType<typeof getTestDb>;

beforeAll(async () => {
  db = await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

// Reset data between tests
afterEach(async () => {
  const tables = ['comments', 'posts', 'users']; // dependency order
  for (const table of tables) {
    await db.execute(sql.raw(`TRUNCATE ${table} CASCADE`));
  }
});
```

```json
// jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "..",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\.ts$": "ts-jest" },
  "setupFilesAfterSetup": ["./test/setup.ts"],
  "testTimeout": 30000
}
```

### Using Testcontainers

```typescript
// test/helpers/test-database.ts
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../../src/shared/database/schema';

let container: StartedPostgreSqlContainer;
let pool: Pool;

export async function setupTestDatabase() {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test')
    .start();

  pool = new Pool({ connectionString: container.getConnectionUri() });
  const db = drizzle(pool, { schema });

  await migrate(db, { migrationsFolder: './drizzle' });

  return db;
}

export async function teardownTestDatabase() {
  await pool.end();
  await container.stop();
}
```

### Test NestJS Module Override

```typescript
// test/helpers/test-app.helper.ts
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DRIZZLE } from '../../src/shared/database/drizzle.provider';
import { getTestDb } from './test-database';

export async function createTestApp() {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(DRIZZLE)
    .useValue(getTestDb())
    .compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
```

### Rules

- Test against a real PostgreSQL instance — never mock the database for integration/E2E tests
- Use Testcontainers for CI — each test run gets a fresh, isolated database
- Use a local test database for fast development iteration
- Truncate tables between tests — don't rely on test order
- Run migrations in test setup — ensures schema matches production
- Override the `DRIZZLE` provider in NestJS test module to inject the test database
