---
title: Self-Referential Relations
tags: relations, self-referential, hierarchy, tree
---

## Self-Referential Relations

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
