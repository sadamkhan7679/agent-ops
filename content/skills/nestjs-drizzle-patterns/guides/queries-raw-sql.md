---
title: Raw SQL and Custom Queries
tags: queries, raw-sql, sql-template, custom
---

## Raw SQL and Custom Queries

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
