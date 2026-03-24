---
title: Select Query Patterns
tags: queries, select, filtering, ordering
---

## Select Query Patterns

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
