---
title: Database Seeding
tags: migrations, seeding, fixtures, test-data
---

## Database Seeding

Seed scripts populate the database with initial data for development, testing, or production defaults.

### Seed Script

```typescript
// src/shared/database/seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { users, categories, products } from './schema';
import { hashPassword } from '@/common/utils/password.util';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Seeding database...');

  // Seed admin user
  const [admin] = await db
    .insert(users)
    .values({
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash: await hashPassword('admin123'),
      role: 'admin',
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  console.log('Admin user:', admin?.id ?? 'already exists');

  // Seed categories
  const categoryData = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Books', slug: 'books' },
  ];

  const seededCategories = await db
    .insert(categories)
    .values(categoryData)
    .onConflictDoNothing({ target: categories.slug })
    .returning();

  console.log(`Seeded ${seededCategories.length} categories`);

  // Seed products
  if (seededCategories.length > 0) {
    const productData = seededCategories.flatMap((cat) =>
      Array.from({ length: 5 }, (_, i) => ({
        name: `${cat.name} Product ${i + 1}`,
        slug: `${cat.slug}-product-${i + 1}`,
        price: (Math.random() * 100 + 10).toFixed(2),
        stock: Math.floor(Math.random() * 100),
        categoryId: cat.id,
      })),
    );

    await db.insert(products).values(productData).onConflictDoNothing({ target: products.slug });
    console.log(`Seeded ${productData.length} products`);
  }

  await pool.end();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
```

### Test Fixtures

```typescript
// test/helpers/database.helper.ts
import { DrizzleDB } from '@/shared/database/drizzle.provider';
import { users, posts, comments } from '@/shared/database/schema';
import { sql } from 'drizzle-orm';

export async function resetDatabase(db: DrizzleDB) {
  // Truncate in dependency order
  await db.execute(sql`TRUNCATE comments, posts, users CASCADE`);
}

export async function seedTestUsers(db: DrizzleDB) {
  return db
    .insert(users)
    .values([
      { email: 'alice@test.com', name: 'Alice', passwordHash: 'hashed', role: 'admin' },
      { email: 'bob@test.com', name: 'Bob', passwordHash: 'hashed', role: 'member' },
      { email: 'charlie@test.com', name: 'Charlie', passwordHash: 'hashed', role: 'member' },
    ])
    .returning();
}

export async function seedTestPosts(db: DrizzleDB, authorId: string) {
  return db
    .insert(posts)
    .values([
      { title: 'First Post', content: 'Content 1', authorId },
      { title: 'Second Post', content: 'Content 2', authorId },
    ])
    .returning();
}
```

### Running Seeds

```json
{
  "scripts": {
    "db:seed": "tsx src/shared/database/seed.ts",
    "db:reset": "pnpm db:migrate && pnpm db:seed"
  }
}
```

### Rules

- Use `onConflictDoNothing()` to make seed scripts idempotent — safe to run multiple times
- Keep production seeds minimal — admin users, default categories, system config
- Keep test fixtures in `test/helpers/` — separate from production seeds
- Use `TRUNCATE ... CASCADE` in test helpers to reset cleanly between test suites
- Run seeds with `tsx` (not `ts-node`) for fast TypeScript execution
- Never seed real passwords in production — use environment variables for initial admin credentials
