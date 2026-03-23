---
title: Table Schema Definitions
tags: schema, tables, columns, types
---

## Table Schema Definitions

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
