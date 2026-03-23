---
title: PostgreSQL Enums with Drizzle
tags: schema, enums, pgEnum, types
---

## PostgreSQL Enums with Drizzle

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
