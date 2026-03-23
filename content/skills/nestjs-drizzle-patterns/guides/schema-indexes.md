---
title: Index Definitions
tags: schema, indexes, performance, unique
---

## Index Definitions

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
