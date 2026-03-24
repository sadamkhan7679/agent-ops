# Nestjs Drizzle Patterns — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

Deep Drizzle ORM patterns for NestJS applications covering schema design, migrations, relations, transactions, query builder, repositories, and testing. Use when integrating Drizzle with NestJS, designing database schemas, writing complex queries, or managing migrations.

## Table of Contents

1. [Setup & Integration: Drizzle Configuration](#1-drizzle-configuration)
2. [Setup & Integration: Drizzle NestJS Module Setup](#2-drizzle-nestjs-module-setup)
3. [Schema Design: PostgreSQL Enums with Drizzle](#3-postgresql-enums-with-drizzle)
4. [Schema Design: Index Definitions](#4-index-definitions)
5. [Schema Design: Table Schema Definitions](#5-table-schema-definitions)
6. [Relations & Joins: Many-to-Many Relations](#6-many-to-many-relations)
7. [Relations & Joins: One-to-Many Relations](#7-one-to-many-relations)
8. [Relations & Joins: Self-Referential Relations](#8-self-referential-relations)
9. [Query Builder: Insert, Update, and Delete Patterns](#9-insert-update-and-delete-patterns)
10. [Query Builder: Raw SQL and Custom Queries](#10-raw-sql-and-custom-queries)
11. [Query Builder: Select Query Patterns](#11-select-query-patterns)
12. [Transactions: Basic Transactions](#12-basic-transactions)
13. [Transactions: Nested Transactions and Savepoints](#13-nested-transactions-and-savepoints)
14. [Repository Pattern: Generic Base Repository](#14-generic-base-repository)
15. [Repository Pattern: Domain Repository Patterns](#15-domain-repository-patterns)
16. [Migrations: Database Seeding](#16-database-seeding)
17. [Migrations: Migration Workflow](#17-migration-workflow)
18. [Performance: Connection Pool Configuration](#18-connection-pool-configuration)
19. [Performance: Query Optimization](#19-query-optimization)
20. [Testing: Database Testing Setup](#20-database-testing-setup)
21. [Testing: Repository Testing Patterns](#21-repository-testing-patterns)

---

## 1. Drizzle Configuration

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

---

## 2. Drizzle NestJS Module Setup

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

---

## 3. PostgreSQL Enums with Drizzle

Use `pgEnum` for type-safe, database-enforced enumeration values.

### Defining Enums

```typescript
// shared/database/schema/enums.ts
import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator', 'member', 'guest']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
```

### Using Enums in Tables

```typescript
// shared/database/schema/users.schema.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: userRoleEnum('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Deriving TypeScript Types

```typescript
// shared/database/schema/enums.ts
export const userRoleEnum = pgEnum('user_role', ['admin', 'moderator', 'member', 'guest']);

// Derive the union type from the enum
export type UserRole = (typeof userRoleEnum.enumValues)[number];
// Result: 'admin' | 'moderator' | 'member' | 'guest'

// Use in DTOs and services
import { IsEnum } from 'class-validator';

export class UpdateRoleDto {
  @IsEnum(userRoleEnum.enumValues)
  role: UserRole;
}
```

### When to Use Enums vs Check Constraints

```typescript
// USE pgEnum when: values are stable, referenced across tables, need type safety
export const statusEnum = pgEnum('status', ['active', 'inactive', 'suspended']);

// USE varchar + check when: values change frequently or are user-configurable
export const tags = pgTable('tags', {
  name: varchar('name', { length: 50 }).notNull(),
  // Validated at application level, not database level
});
```

### Rules

- Define all enums in a single `enums.ts` file for easy discovery
- Export TypeScript union types alongside enums for use in DTOs and services
- Use enums for stable, well-known value sets (roles, statuses, priorities)
- Use varchar for values that change often — adding a new enum value requires a migration
- Name enums with `_enum` suffix in Drizzle, snake_case for the PostgreSQL name

---

## 4. Index Definitions

Define indexes in the schema for query performance and uniqueness constraints.

### Table-Level Indexes

```typescript
import { pgTable, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    organizationId: uuid('organization_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
    index('users_org_id_idx').on(table.organizationId),
    index('users_created_at_idx').on(table.createdAt.desc()),
  ],
);
```

### Composite Indexes

```typescript
export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull(),
    userId: uuid('user_id').notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Composite unique — one membership per user per team
    uniqueIndex('team_members_team_user_idx').on(table.teamId, table.userId),
    // Composite for common query pattern
    index('team_members_team_role_idx').on(table.teamId, table.role),
  ],
);
```

### Partial Indexes

```typescript
import { sql } from 'drizzle-orm';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    status: varchar('status', { length: 50 }).notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Only index active orders — smaller index, faster queries
    index('orders_active_idx')
      .on(table.userId, table.createdAt)
      .where(sql`${table.status} != 'cancelled'`),
  ],
);
```

### GIN Index for JSONB

```typescript
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    metadata: jsonb('metadata'),
    tags: jsonb('tags').$type<string[]>(),
  },
  (table) => [
    index('products_metadata_idx').using('gin', table.metadata),
    index('products_tags_idx').using('gin', table.tags),
  ],
);
```

### Rules

- Add indexes for columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses
- Use composite indexes for multi-column query patterns — column order matters
- Use `uniqueIndex` instead of `.unique()` on columns when you need a named index
- Use partial indexes to reduce index size when you only query a subset of rows
- Don't over-index — each index slows down writes. Add indexes based on actual query patterns
- Name indexes descriptively: `tablename_column1_column2_idx`

---

## 5. Table Schema Definitions

Define tables using Drizzle's TypeScript-first schema builder for full type safety from database to API.

### Standard Table Pattern

```typescript
// shared/database/schema/users.schema.ts
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// Infer types from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### Common Column Patterns

```typescript
import { pgTable, uuid, varchar, integer, numeric, jsonb, timestamp, text } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),

  // String types
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),

  // Numeric types
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stock: integer('stock').notNull().default(0),

  // JSON
  metadata: jsonb('metadata').$type<{ color?: string; size?: string }>(),

  // Foreign key
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // soft delete
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
```

### Reusable Column Helpers

```typescript
// shared/database/schema/helpers.ts
import { uuid, timestamp } from 'drizzle-orm/pg-core';

export const idColumn = {
  id: uuid('id').primaryKey().defaultRandom(),
};

export const timestampColumns = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
};

// Usage
export const orders = pgTable('orders', {
  ...idColumn,
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  ...timestampColumns,
});
```

### Rules

- One schema file per table: `users.schema.ts`, `products.schema.ts`
- Always export `$inferSelect` and `$inferInsert` types for use in services/DTOs
- Use `uuid` with `defaultRandom()` for primary keys — not auto-increment
- Always add `createdAt` and `updatedAt` timestamps with timezone
- Use `$onUpdate` for automatic `updatedAt` — don't rely on manual updates
- Use snake_case for column names (PostgreSQL convention), camelCase for TypeScript properties

---

## 6. Many-to-Many Relations

Implement many-to-many relationships using explicit junction tables with Drizzle.

### Junction Table Schema

```typescript
// shared/database/schema/posts-tags.schema.ts
import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { posts } from './posts.schema';
import { tags } from './tags.schema';

export const postsToTags = pgTable(
  'posts_to_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.postId, table.tagId] }),
  ],
);
```

### Relations Declaration

```typescript
// shared/database/schema/relations.ts
import { relations } from 'drizzle-orm';
import { posts } from './posts.schema';
import { tags } from './tags.schema';
import { postsToTags } from './posts-tags.schema';

export const postsRelations = relations(posts, ({ many }) => ({
  postsToTags: many(postsToTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postsToTags: many(postsToTags),
}));

export const postsToTagsRelations = relations(postsToTags, ({ one }) => ({
  post: one(posts, {
    fields: [postsToTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postsToTags.tagId],
    references: [tags.id],
  }),
}));
```

### Querying Through Junction

```typescript
// Load post with its tags
const postWithTags = await this.db.query.posts.findFirst({
  where: eq(posts.id, postId),
  with: {
    postsToTags: {
      with: { tag: true },
    },
  },
});

// Flatten: extract just the tag objects
const tags = postWithTags?.postsToTags.map((pt) => pt.tag) ?? [];

// Find all posts for a specific tag
const postsForTag = await this.db.query.postsToTags.findMany({
  where: eq(postsToTags.tagId, tagId),
  with: { post: true },
});
```

### Managing Relations

```typescript
// Add tags to a post
async addTags(postId: string, tagIds: string[]) {
  await this.db.insert(postsToTags).values(
    tagIds.map((tagId) => ({ postId, tagId })),
  ).onConflictDoNothing();
}

// Replace all tags on a post
async setTags(postId: string, tagIds: string[]) {
  await this.db.transaction(async (tx) => {
    await tx.delete(postsToTags).where(eq(postsToTags.postId, postId));
    if (tagIds.length > 0) {
      await tx.insert(postsToTags).values(
        tagIds.map((tagId) => ({ postId, tagId })),
      );
    }
  });
}

// Remove a tag from a post
async removeTag(postId: string, tagId: string) {
  await this.db.delete(postsToTags).where(
    and(eq(postsToTags.postId, postId), eq(postsToTags.tagId, tagId)),
  );
}
```

### Rules

- Always use an explicit junction table — Drizzle does not support implicit many-to-many
- Use composite primary key on the junction table (`primaryKey({ columns: [...] })`)
- Add `onDelete: 'cascade'` on both foreign keys so removing a post/tag cleans up the junction
- Use `onConflictDoNothing()` when adding relations to handle duplicates gracefully
- Wrap replace operations in a transaction to maintain consistency

---

## 7. One-to-Many Relations

Define one-to-many relationships using Drizzle's `relations` API for type-safe relational queries.

### Schema Definition

```typescript
// shared/database/schema/posts.schema.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  body: text('body').notNull(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Relations Declaration

```typescript
// shared/database/schema/relations.ts
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { posts } from './posts.schema';
import { comments } from './comments.schema';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  comments: many(comments),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));
```

### Querying with Relations

```typescript
// Relational query — load post with author and comments
const postWithRelations = await this.db.query.posts.findFirst({
  where: eq(posts.id, postId),
  with: {
    author: {
      columns: { id: true, name: true, avatarUrl: true },
    },
    comments: {
      with: { author: { columns: { id: true, name: true } } },
      orderBy: [desc(comments.createdAt)],
      limit: 20,
    },
  },
});

// Manual join — when you need more control
const results = await this.db
  .select({
    post: posts,
    authorName: users.name,
  })
  .from(posts)
  .innerJoin(users, eq(posts.authorId, users.id))
  .where(eq(users.id, userId));
```

### Rules

- Define foreign keys on the table schema (`.references()`) — this creates the DB constraint
- Define relations separately in `relations.ts` — these power the `db.query` API
- Both are needed: references for DB integrity, relations for type-safe nested queries
- Use `onDelete: 'cascade'` when child records should be deleted with the parent
- Use `onDelete: 'restrict'` (default) to prevent deleting parents with children
- Prefer relational queries (`db.query.*.findFirst/findMany`) over manual joins for nested data

---

## 8. Self-Referential Relations

Model hierarchical data (categories, org charts, comments threads) using self-referencing foreign keys.

### Schema

```typescript
// shared/database/schema/categories.schema.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  parentId: uuid('parent_id').references((): any => categories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Relations

```typescript
// shared/database/schema/relations.ts
import { relations } from 'drizzle-orm';
import { categories } from './categories.schema';

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, {
    relationName: 'parentChild',
  }),
}));
```

### Querying Hierarchies

```typescript
// Get category with parent and children
const category = await this.db.query.categories.findFirst({
  where: eq(categories.id, categoryId),
  with: {
    parent: true,
    children: {
      with: {
        children: true, // two levels deep
      },
    },
  },
});

// Get all root categories with their trees
const roots = await this.db.query.categories.findMany({
  where: isNull(categories.parentId),
  with: {
    children: {
      with: { children: true },
    },
  },
});
```

### Recursive CTE for Deep Trees

```typescript
import { sql } from 'drizzle-orm';

// Get all ancestors of a category
async getAncestors(categoryId: string) {
  const result = await this.db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT * FROM categories WHERE id = ${categoryId}
      UNION ALL
      SELECT c.* FROM categories c
      INNER JOIN ancestors a ON c.id = a.parent_id
    )
    SELECT * FROM ancestors WHERE id != ${categoryId}
  `);
  return result.rows;
}

// Get all descendants
async getDescendants(categoryId: string) {
  const result = await this.db.execute(sql`
    WITH RECURSIVE descendants AS (
      SELECT * FROM categories WHERE parent_id = ${categoryId}
      UNION ALL
      SELECT c.* FROM categories c
      INNER JOIN descendants d ON c.parent_id = d.id
    )
    SELECT * FROM descendants
  `);
  return result.rows;
}
```

### Rules

- Use `relationName` to disambiguate self-referential relations (both sides must match)
- Use `: any` on the self-referencing `.references()` to avoid circular type errors
- Use `onDelete: 'set null'` for optional parents, `'cascade'` if children should be deleted
- Drizzle's relational `with` works for fixed-depth queries (2-3 levels)
- Use recursive CTEs (`WITH RECURSIVE`) for arbitrary-depth tree traversal

---

## 9. Insert, Update, and Delete Patterns

Type-safe mutation operations with returning clauses and conflict handling.

### Insert

```typescript
// Single insert with returning
const [newUser] = await this.db
  .insert(users)
  .values({
    email: 'user@example.com',
    name: 'New User',
    passwordHash: hashedPassword,
  })
  .returning();

// Bulk insert
const newProducts = await this.db
  .insert(products)
  .values([
    { name: 'Product A', price: '29.99', categoryId },
    { name: 'Product B', price: '49.99', categoryId },
    { name: 'Product C', price: '99.99', categoryId },
  ])
  .returning({ id: products.id, name: products.name });
```

### Upsert (Insert or Update)

```typescript
// Insert or update on conflict
const [upserted] = await this.db
  .insert(userPreferences)
  .values({
    userId,
    theme: 'dark',
    language: 'en',
  })
  .onConflictDoUpdate({
    target: userPreferences.userId,
    set: {
      theme: 'dark',
      language: 'en',
      updatedAt: new Date(),
    },
  })
  .returning();

// Insert and skip if exists
await this.db
  .insert(postsToTags)
  .values({ postId, tagId })
  .onConflictDoNothing();
```

### Update

```typescript
// Update with returning
const [updated] = await this.db
  .update(users)
  .set({
    name: 'Updated Name',
    updatedAt: new Date(),
  })
  .where(eq(users.id, userId))
  .returning();

// Conditional update
const [order] = await this.db
  .update(orders)
  .set({ status: 'shipped', shippedAt: new Date() })
  .where(and(
    eq(orders.id, orderId),
    eq(orders.status, 'confirmed'), // only ship confirmed orders
  ))
  .returning();

if (!order) {
  throw new ConflictException('Order is not in a shippable state');
}

// Increment a value
import { sql } from 'drizzle-orm';

await this.db
  .update(products)
  .set({ stock: sql`${products.stock} - ${quantity}` })
  .where(and(
    eq(products.id, productId),
    gte(products.stock, quantity), // prevent negative stock
  ));
```

### Delete

```typescript
// Hard delete with returning
const [deleted] = await this.db
  .delete(comments)
  .where(eq(comments.id, commentId))
  .returning();

// Soft delete
const [softDeleted] = await this.db
  .update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId))
  .returning();

// Bulk delete
await this.db
  .delete(sessions)
  .where(lt(sessions.expiresAt, new Date()));
```

### Rules

- Always use `.returning()` when you need the created/updated record — avoids a second query
- Use `.onConflictDoUpdate()` for upserts — specify the conflict target column(s)
- Use conditional `WHERE` clauses on updates to enforce state transitions (optimistic locking)
- Prefer soft deletes (set `deletedAt`) for user-facing data; hard deletes for transient data (sessions, tokens)
- Use `sql` template for arithmetic operations — don't read-then-write in application code

---

## 10. Raw SQL and Custom Queries

Use Drizzle's `sql` template tag for complex queries that go beyond the query builder.

### SQL Template Tag

```typescript
import { sql } from 'drizzle-orm';

// Type-safe SQL fragments in select
const usersWithPostCount = await this.db
  .select({
    id: users.id,
    name: users.name,
    postCount: sql<number>`(SELECT count(*) FROM posts WHERE posts.author_id = ${users.id})`,
  })
  .from(users);

// SQL in WHERE clause
const recentActiveUsers = await this.db
  .select()
  .from(users)
  .where(sql`${users.lastLoginAt} > now() - interval '30 days'`);
```

### Full Raw Queries

```typescript
// Execute raw SQL with parameterized values
const result = await this.db.execute(sql`
  SELECT
    u.id,
    u.name,
    count(p.id) AS post_count,
    coalesce(sum(p.views), 0) AS total_views
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  WHERE u.is_active = true
  GROUP BY u.id, u.name
  HAVING count(p.id) > ${minPosts}
  ORDER BY total_views DESC
  LIMIT ${limit}
`);

return result.rows;
```

### Full-Text Search

```typescript
// PostgreSQL full-text search
async search(query: string) {
  const results = await this.db
    .select({
      id: posts.id,
      title: posts.title,
      rank: sql<number>`ts_rank(
        to_tsvector('english', ${posts.title} || ' ' || ${posts.content}),
        plainto_tsquery('english', ${query})
      )`,
    })
    .from(posts)
    .where(sql`
      to_tsvector('english', ${posts.title} || ' ' || ${posts.content})
      @@ plainto_tsquery('english', ${query})
    `)
    .orderBy(sql`ts_rank(
      to_tsvector('english', ${posts.title} || ' ' || ${posts.content}),
      plainto_tsquery('english', ${query})
    ) DESC`)
    .limit(20);

  return results;
}
```

### Window Functions

```typescript
const rankedOrders = await this.db.execute(sql`
  SELECT
    id,
    user_id,
    total,
    created_at,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS order_rank
  FROM orders
  WHERE status = 'completed'
`);
```

### Rules

- Use `sql<Type>` generic to type the return value of raw SQL fragments
- Always use template interpolation (`${value}`) — never concatenate strings into SQL
- Drizzle parameterizes all interpolated values automatically — safe from SQL injection
- Use `db.execute(sql`...`)` for complex queries that don't map to the query builder
- Prefer the query builder for standard CRUD — use raw SQL only when needed for PostgreSQL-specific features
- Type the result with `sql<number>`, `sql<string>`, etc. for type safety in select columns

---

## 11. Select Query Patterns

Build type-safe select queries with Drizzle's query builder and relational API.

### Basic Select

```typescript
import { eq, ne, gt, gte, lt, lte, like, ilike, isNull, isNotNull, and, or, desc, asc } from 'drizzle-orm';

// Select all columns
const allUsers = await this.db.select().from(users);

// Select specific columns
const userNames = await this.db
  .select({ id: users.id, name: users.name, email: users.email })
  .from(users);

// Single record
const [user] = await this.db.select().from(users).where(eq(users.id, userId));
```

### Filtering

```typescript
// Equality
.where(eq(users.role, 'admin'))

// Multiple conditions (AND)
.where(and(
  eq(users.isActive, true),
  gte(users.createdAt, startDate),
  ilike(users.name, `%${search}%`),
))

// OR conditions
.where(or(
  eq(users.role, 'admin'),
  eq(users.role, 'moderator'),
))

// IN clause
import { inArray, notInArray } from 'drizzle-orm';
.where(inArray(users.id, userIds))

// BETWEEN
import { between } from 'drizzle-orm';
.where(between(orders.total, 100, 500))

// NULL checks
.where(isNull(users.deletedAt))
.where(isNotNull(users.emailVerifiedAt))
```

### Ordering and Pagination

```typescript
const results = await this.db
  .select()
  .from(users)
  .where(eq(users.isActive, true))
  .orderBy(desc(users.createdAt), asc(users.name))
  .limit(20)
  .offset(40); // page 3, 20 per page
```

### Aggregations

```typescript
import { count, sum, avg, min, max, sql } from 'drizzle-orm';

// Count
const [{ total }] = await this.db
  .select({ total: count() })
  .from(users)
  .where(eq(users.isActive, true));

// Group by with aggregation
const ordersByStatus = await this.db
  .select({
    status: orders.status,
    count: count(),
    totalRevenue: sum(orders.total),
    avgOrder: avg(orders.total),
  })
  .from(orders)
  .groupBy(orders.status);
```

### Relational Query API

```typescript
// findMany with filters and relations
const usersWithPosts = await this.db.query.users.findMany({
  where: eq(users.isActive, true),
  columns: { id: true, name: true, email: true },
  with: {
    posts: {
      columns: { id: true, title: true },
      where: eq(posts.published, true),
      orderBy: [desc(posts.createdAt)],
      limit: 5,
    },
  },
  orderBy: [desc(users.createdAt)],
  limit: 20,
});

// findFirst — returns single record or undefined
const user = await this.db.query.users.findFirst({
  where: eq(users.email, email),
  with: { profile: true },
});
```

### Rules

- Use the query builder (`db.select().from()`) for flat queries and aggregations
- Use the relational API (`db.query.*.findMany()`) for nested/related data
- Always parameterize values — Drizzle handles SQL injection prevention automatically
- Use `ilike` for case-insensitive search, `like` for case-sensitive
- Prefer `limit` + `offset` for simple pagination; use cursor-based for large datasets

---

## 12. Basic Transactions

Wrap multiple database operations in a transaction to ensure atomicity — all succeed or all roll back.

### Transaction Pattern

```typescript
// modules/orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createOrder(userId: string, items: CreateOrderItemDto[]) {
    return this.db.transaction(async (tx) => {
      // 1. Create the order
      const [order] = await tx
        .insert(orders)
        .values({ userId, status: 'pending', total: '0' })
        .returning();

      // 2. Create order items and calculate total
      let total = 0;
      for (const item of items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product?.name ?? item.productId}`);
          // Transaction auto-rolls back on throw
        }

        // Decrement stock
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));

        // Create order item
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        });

        total += parseFloat(product.price) * item.quantity;
      }

      // 3. Update order total
      const [completed] = await tx
        .update(orders)
        .set({ total: total.toFixed(2) })
        .where(eq(orders.id, order.id))
        .returning();

      return completed;
    });
  }
}
```

### Simple Transfer Example

```typescript
async transfer(fromAccountId: string, toAccountId: string, amount: number) {
  return this.db.transaction(async (tx) => {
    // Debit
    const [from] = await tx
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - ${amount}` })
      .where(and(
        eq(accounts.id, fromAccountId),
        gte(accounts.balance, amount), // prevent overdraft
      ))
      .returning();

    if (!from) {
      throw new BadRequestException('Insufficient balance');
    }

    // Credit
    await tx
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.id, toAccountId));

    // Audit log
    await tx.insert(transfers).values({
      fromAccountId,
      toAccountId,
      amount: amount.toFixed(2),
    });

    return { success: true };
  });
}
```

### Rules

- Use `db.transaction(async (tx) => { ... })` — pass `tx` to all queries inside
- Throw an exception to trigger rollback — Drizzle catches and rolls back automatically
- Use `tx` (not `this.db`) for all operations inside the callback — using `db` bypasses the transaction
- Keep transactions short — don't include HTTP calls, file I/O, or slow operations
- Use `sql` template for atomic arithmetic (increment/decrement) instead of read-modify-write

---

## 13. Nested Transactions and Savepoints

Use savepoints for partial rollback within a larger transaction.

### Savepoint Pattern

```typescript
async processOrderWithOptionalGift(userId: string, orderDto: CreateOrderDto) {
  return this.db.transaction(async (tx) => {
    // Main order — must succeed
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        total: orderDto.total,
        status: 'confirmed',
      })
      .returning();

    await tx.insert(orderItems).values(
      orderDto.items.map((item) => ({ orderId: order.id, ...item })),
    );

    // Gift wrapping — optional, should not fail the order
    if (orderDto.giftMessage) {
      try {
        await tx.transaction(async (nested) => {
          // This creates a SAVEPOINT
          const [gift] = await nested
            .insert(giftWrappings)
            .values({
              orderId: order.id,
              message: orderDto.giftMessage,
              style: orderDto.giftStyle ?? 'standard',
            })
            .returning();

          await nested
            .update(orders)
            .set({ total: sql`${orders.total} + 5.00` })
            .where(eq(orders.id, order.id));
        });
      } catch (error) {
        // Savepoint rolled back, but outer transaction continues
        // Order is created without gift wrapping
        console.warn('Gift wrapping failed, continuing without:', error.message);
      }
    }

    return order;
  });
}
```

### Service Composition with Transactions

```typescript
// Pass the transaction to other services/repositories
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkout(userId: string, cartItems: CartItem[]) {
    return this.db.transaction(async (tx) => {
      // Each method accepts the transaction
      const order = await this.ordersRepo.create(tx, { userId, status: 'pending' });
      await this.inventoryService.reserveStock(tx, cartItems);
      await this.ordersRepo.addItems(tx, order.id, cartItems);
      await this.ordersRepo.updateTotal(tx, order.id);

      return order;
    });
  }
}

// Repository accepts optional transaction
@Injectable()
export class OrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(txOrDb: DrizzleDB, data: NewOrder) {
    const [order] = await txOrDb.insert(orders).values(data).returning();
    return order;
  }
}
```

### Transaction-Aware Repository Base

```typescript
@Injectable()
export abstract class BaseRepository {
  constructor(@Inject(DRIZZLE) protected readonly db: DrizzleDB) {}

  // Allow callers to pass a transaction or use the default db
  protected getDb(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }
}

// Usage
@Injectable()
export class UsersRepository extends BaseRepository {
  async create(data: NewUser, tx?: DrizzleDB) {
    const [user] = await this.getDb(tx).insert(users).values(data).returning();
    return user;
  }
}
```

### Rules

- Drizzle supports nested `tx.transaction()` calls — they map to PostgreSQL SAVEPOINTs
- Catch errors from nested transactions to allow partial failure without rolling back the outer transaction
- Pass `tx` through to repositories/services that participate in the same transaction
- Use a `getDb(tx?)` helper pattern for repositories that work both inside and outside transactions
- Never start a new `db.transaction()` inside an existing one — use the passed `tx` to nest properly

---

## 14. Generic Base Repository

A generic base repository provides standard CRUD operations for any Drizzle table.

### Base Repository

```typescript
// shared/database/base.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from './drizzle.provider';
import { eq, sql, count, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export interface PaginationParams {
  page: number;
  limit: number;
  where?: SQL;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export abstract class BaseRepository<
  TTable extends PgTable,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert'],
> {
  constructor(
    @Inject(DRIZZLE) protected readonly db: DrizzleDB,
    protected readonly table: TTable,
  ) {}

  async findById(id: string): Promise<TSelect | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id));
    return (record as TSelect) ?? null;
  }

  async findAll(where?: SQL): Promise<TSelect[]> {
    const query = this.db.select().from(this.table);
    if (where) query.where(where);
    return query as unknown as TSelect[];
  }

  async findPaginated(params: PaginationParams): Promise<PaginatedResult<TSelect>> {
    const { page, limit, where } = params;
    const offset = (page - 1) * limit;

    const dataQuery = this.db.select().from(this.table).limit(limit).offset(offset);
    const countQuery = this.db.select({ total: count() }).from(this.table);

    if (where) {
      dataQuery.where(where);
      countQuery.where(where);
    }

    const [data, [{ total }]] = await Promise.all([dataQuery, countQuery]);

    return {
      data: data as unknown as TSelect[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: TInsert, tx?: DrizzleDB): Promise<TSelect> {
    const db = tx ?? this.db;
    const [record] = await db.insert(this.table).values(data as any).returning();
    return record as TSelect;
  }

  async update(id: string, data: Partial<TInsert>, tx?: DrizzleDB): Promise<TSelect | null> {
    const db = tx ?? this.db;
    const [record] = await db
      .update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning();
    return (record as TSelect) ?? null;
  }

  async delete(id: string, tx?: DrizzleDB): Promise<TSelect | null> {
    const db = tx ?? this.db;
    const [record] = await db
      .delete(this.table)
      .where(eq((this.table as any).id, id))
      .returning();
    return (record as TSelect) ?? null;
  }
}
```

### Usage

```typescript
// modules/users/users.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/shared/database/base.repository';
import { users, User, NewUser } from '@/shared/database/schema';

@Injectable()
export class UsersRepository extends BaseRepository<typeof users, User, NewUser> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, users);
  }

  // Domain-specific queries
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ?? null;
  }

  async findActiveUsers(page: number, limit: number) {
    return this.findPaginated({
      page,
      limit,
      where: eq(users.isActive, true),
    });
  }
}
```

### Rules

- The base repository handles generic CRUD — domain repositories add specific queries
- Accept optional `tx` parameter for transaction support on mutations
- Use `$inferSelect` and `$inferInsert` types from the table for full type safety
- Don't force every query through the base — write custom methods for complex queries
- Keep the base repository abstract — never inject it directly, always extend it

---

## 15. Domain Repository Patterns

Domain repositories encapsulate complex queries specific to a bounded context.

### Domain Repository

```typescript
// modules/orders/orders.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '@/shared/database/drizzle.provider';
import { orders, orderItems, products, users } from '@/shared/database/schema';
import { and, eq, gte, lte, desc, sql, count, sum, SQL } from 'drizzle-orm';

@Injectable()
export class OrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findWithItems(orderId: string) {
    return this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: {
              columns: { id: true, name: true, price: true },
            },
          },
        },
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByUser(userId: string, params: { page: number; limit: number; status?: string }) {
    const conditions: SQL[] = [eq(orders.userId, userId)];
    if (params.status) {
      conditions.push(eq(orders.status, params.status));
    }

    const where = and(...conditions);
    const offset = (params.page - 1) * params.limit;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(orders).where(where),
    ]);

    return {
      data,
      meta: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
    };
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    return this.db
      .select({
        date: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
        orderCount: count(),
        revenue: sum(orders.total),
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        eq(orders.status, 'completed'),
      ))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})::date`);
  }

  async getBestSellers(limit: number = 10) {
    return this.db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalSold: sum(orderItems.quantity),
        totalRevenue: sql<string>`sum(${orderItems.quantity} * ${orderItems.unitPrice})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, 'completed'))
      .groupBy(orderItems.productId, products.name)
      .orderBy(sql`sum(${orderItems.quantity}) DESC`)
      .limit(limit);
  }

  async updateStatus(orderId: string, status: string, tx?: DrizzleDB) {
    const db = tx ?? this.db;
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated ?? null;
  }
}
```

### Rules

- One repository per aggregate root — `OrdersRepository` owns queries for orders and order items
- Repositories return data — they don't throw HTTP exceptions (that's the service's job)
- Encapsulate query complexity — services should call `getRevenueReport()`, not build SQL
- Accept `tx?` parameter on write methods for transaction support
- Use relational queries (`db.query.*`) for nested data, query builder for aggregations and joins
- Keep repository methods focused — one query per method, name describes the result

---

## 16. Database Seeding

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

---

## 17. Migration Workflow

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

---

## 18. Connection Pool Configuration

Properly configure the PostgreSQL connection pool to balance throughput and resource usage.

### Pool Configuration

```typescript
// shared/database/drizzle.provider.ts
import { Pool } from 'pg';

export const DrizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.get<string>('database.url'),

      // Pool sizing
      max: config.get<number>('database.poolMax', 20),
      min: config.get<number>('database.poolMin', 2),

      // Timeouts
      idleTimeoutMillis: 30_000,          // close idle connections after 30s
      connectionTimeoutMillis: 5_000,     // fail if can't connect in 5s
      allowExitOnIdle: true,              // allow process to exit if pool is idle

      // SSL
      ssl: config.get<boolean>('database.ssl')
        ? { rejectUnauthorized: false }
        : false,
    });

    // Verify connection on startup
    const client = await pool.connect();
    client.release();

    // Monitor pool health
    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });

    return drizzle(pool, { schema });
  },
};
```

### Pool Sizing Guidelines

```text
# Formula: pool_max = (cpu_cores * 2) + disk_spindles
# For SSDs: pool_max = cpu_cores * 2 + 1

# Small app (1-2 vCPUs):    max: 5-10
# Medium app (4 vCPUs):     max: 10-20
# Large app (8+ vCPUs):     max: 20-50

# IMPORTANT: total connections across all app instances must not exceed
# PostgreSQL max_connections (default: 100)
# 3 app instances × 20 pool max = 60 connections (safe)
# 5 app instances × 30 pool max = 150 connections (exceeds default!)
```

### Health Check Endpoint

```typescript
// modules/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  async check() {
    try {
      await this.db.execute(sql`SELECT 1`);
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException('Database connection failed');
    }
  }
}
```

### Graceful Shutdown

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  await app.listen(3000);
}

// shared/database/database.module.ts
@Global()
@Module({
  providers: [
    DrizzleProvider,
    {
      provide: 'PG_POOL',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Pool({ connectionString: config.get('database.url') });
      },
    },
  ],
  exports: [DrizzleProvider],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Database pool closed');
  }
}
```

### Rules

- Set `max` based on vCPU count and total instance count — don't exceed PostgreSQL's `max_connections`
- Set `connectionTimeoutMillis` to fail fast (5s) rather than queue requests indefinitely
- Enable `allowExitOnIdle` for serverless/short-lived processes
- Verify the connection on startup — fail fast if the database is unreachable
- Implement graceful shutdown with `OnModuleDestroy` to drain the pool on process exit
- Use a connection pooler (PgBouncer, Supabase Pooler) in production for high-traffic apps

---

## 19. Query Optimization

Identify and fix common performance bottlenecks in Drizzle queries.

### Avoiding N+1 Queries

```typescript
// BAD: N+1 — one query per user to get their posts
const users = await this.db.select().from(users);
for (const user of users) {
  user.posts = await this.db
    .select()
    .from(posts)
    .where(eq(posts.authorId, user.id));
}

// GOOD: Single relational query
const usersWithPosts = await this.db.query.users.findMany({
  with: {
    posts: {
      orderBy: [desc(posts.createdAt)],
      limit: 10,
    },
  },
});

// GOOD: Manual join for flat results
const results = await this.db
  .select({
    userId: users.id,
    userName: users.name,
    postCount: count(posts.id),
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .groupBy(users.id, users.name);
```

### Select Only Needed Columns

```typescript
// BAD: Select all columns including large text fields
const users = await this.db.select().from(users);

// GOOD: Select only what the endpoint needs
const users = await this.db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
    avatarUrl: users.avatarUrl,
  })
  .from(users);

// GOOD: Relational query with column selection
const posts = await this.db.query.posts.findMany({
  columns: { id: true, title: true, createdAt: true },
  with: {
    author: { columns: { id: true, name: true } },
  },
});
```

### Efficient Pagination

```typescript
// Offset pagination — simple but slow for deep pages
const page3 = await this.db
  .select()
  .from(products)
  .orderBy(desc(products.createdAt))
  .limit(20)
  .offset(40);

// Cursor pagination — consistent performance at any depth
async findAfterCursor(cursor: string | undefined, limit: number) {
  const conditions: SQL[] = [eq(products.isActive, true)];

  if (cursor) {
    const [cursorDate, cursorId] = cursor.split('_');
    conditions.push(
      or(
        lt(products.createdAt, new Date(cursorDate)),
        and(
          eq(products.createdAt, new Date(cursorDate)),
          lt(products.id, cursorId),
        ),
      )!,
    );
  }

  const items = await this.db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(desc(products.createdAt), desc(products.id))
    .limit(limit + 1); // fetch one extra to detect hasMore

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;
  const nextCursor = hasMore
    ? `${data[data.length - 1].createdAt.toISOString()}_${data[data.length - 1].id}`
    : null;

  return { data, nextCursor, hasMore };
}
```

### Query Debugging

```typescript
// Log generated SQL
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(pool, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// EXPLAIN ANALYZE for specific queries
const plan = await this.db.execute(
  sql`EXPLAIN ANALYZE SELECT * FROM users WHERE email = ${'test@example.com'}`,
);
console.log(plan.rows);
```

### Rules

- Use relational queries or joins to avoid N+1 — never query in a loop
- Select only needed columns — especially important when tables have large text/jsonb columns
- Use cursor-based pagination for endpoints with large datasets or infinite scroll
- Enable Drizzle logger in development to spot inefficient queries
- Add indexes for columns in `WHERE`, `ORDER BY`, and `JOIN` conditions
- Use `EXPLAIN ANALYZE` to verify query plans use indexes correctly

---

## 20. Database Testing Setup

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

---

## 21. Repository Testing Patterns

Test repositories against a real database to verify query correctness and constraint handling.

### Repository Integration Test

```typescript
// modules/users/users.repository.spec.ts
import { UsersRepository } from './users.repository';
import { setupTestDatabase, teardownTestDatabase, getTestDb } from '../../../test/helpers/test-database';
import { users } from '@/shared/database/schema';
import { DrizzleDB } from '@/shared/database/drizzle.provider';
import { sql } from 'drizzle-orm';

describe('UsersRepository (integration)', () => {
  let db: DrizzleDB;
  let repository: UsersRepository;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new UsersRepository(db);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  afterEach(async () => {
    await db.execute(sql`TRUNCATE users CASCADE`);
  });

  describe('create', () => {
    it('should insert and return the user', async () => {
      const user = await repository.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw on duplicate email', async () => {
      await repository.create({
        email: 'dup@example.com',
        name: 'First',
        passwordHash: 'hashed',
      });

      await expect(
        repository.create({
          email: 'dup@example.com',
          name: 'Second',
          passwordHash: 'hashed',
        }),
      ).rejects.toThrow(); // unique constraint violation
    });
  });

  describe('findByEmail', () => {
    it('should return the user when found', async () => {
      await repository.create({
        email: 'alice@example.com',
        name: 'Alice',
        passwordHash: 'hashed',
      });

      const found = await repository.findByEmail('alice@example.com');

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Alice');
    });

    it('should return null when not found', async () => {
      const found = await repository.findByEmail('nobody@example.com');
      expect(found).toBeNull();
    });
  });

  describe('findPaginated', () => {
    beforeEach(async () => {
      const testUsers = Array.from({ length: 25 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
        passwordHash: 'hashed',
      }));
      await db.insert(users).values(testUsers);
    });

    it('should return correct page and total', async () => {
      const result = await repository.findPaginated({ page: 2, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    it('should return partial last page', async () => {
      const result = await repository.findPaginated({ page: 3, limit: 10 });

      expect(result.data).toHaveLength(5);
    });
  });
});
```

### Test Data Factories

```typescript
// test/factories/user.factory.ts
import { NewUser } from '@/shared/database/schema';

let counter = 0;

export function buildUser(overrides: Partial<NewUser> = {}): NewUser {
  counter++;
  return {
    email: `user${counter}@test.com`,
    name: `Test User ${counter}`,
    passwordHash: 'hashed_password',
    role: 'member',
    isActive: true,
    ...overrides,
  };
}

// Usage in tests
const admin = await repository.create(buildUser({ role: 'admin', email: 'admin@test.com' }));
const inactive = await repository.create(buildUser({ isActive: false }));
```

### Rules

- Repository tests are integration tests — they hit the real database, not mocks
- Truncate tables in `afterEach` to isolate tests
- Test both happy paths (found, created) and edge cases (duplicates, not found, pagination bounds)
- Use factory functions for test data — avoids repeating verbose insert objects
- Verify database constraints (unique, not null, foreign keys) are enforced correctly
- Keep repository tests focused on data access — don't test business logic here

---
