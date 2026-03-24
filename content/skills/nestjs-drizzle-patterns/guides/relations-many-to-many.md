---
title: Many-to-Many Relations
tags: relations, many-to-many, junction-table, joins
---

## Many-to-Many Relations

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
