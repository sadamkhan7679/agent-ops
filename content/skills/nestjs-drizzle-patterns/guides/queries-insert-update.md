---
title: Insert, Update, and Delete Patterns
tags: queries, insert, update, delete, upsert
---

## Insert, Update, and Delete Patterns

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
