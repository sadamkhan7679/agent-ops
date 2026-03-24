---
title: Query Optimization
tags: performance, queries, explain, n+1
---

## Query Optimization

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
