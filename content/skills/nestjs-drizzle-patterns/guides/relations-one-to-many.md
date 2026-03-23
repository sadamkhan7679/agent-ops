---
title: One-to-Many Relations
tags: relations, one-to-many, foreign-keys, joins
---

## One-to-Many Relations

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
