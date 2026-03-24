---
title: RBAC Database Schema
tags: rbac, schema, roles, permissions, database
---

## RBAC Database Schema

Design a flexible role and permission schema using Drizzle ORM.

### Schema Definition

```typescript
// shared/database/schema/roles.schema.ts
import { pgTable, uuid, varchar, text, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 'admin', 'editor', 'viewer'
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(), // 'users:create', 'posts:delete'
  description: text('description'),
  resource: varchar('resource', { length: 50 }).notNull(),   // 'users', 'posts'
  action: varchar('action', { length: 50 }).notNull(),       // 'create', 'read', 'update', 'delete'
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ],
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
  ],
);
```

### Relations

```typescript
// shared/database/schema/relations.ts
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));
```

### Seed Default Roles

```typescript
// shared/database/seeds/roles.seed.ts
const defaultRoles = [
  { name: 'admin', description: 'Full system access', isDefault: false },
  { name: 'editor', description: 'Can create and edit content', isDefault: false },
  { name: 'viewer', description: 'Read-only access', isDefault: true },
];

const defaultPermissions = [
  { name: 'users:create', resource: 'users', action: 'create' },
  { name: 'users:read', resource: 'users', action: 'read' },
  { name: 'users:update', resource: 'users', action: 'update' },
  { name: 'users:delete', resource: 'users', action: 'delete' },
  { name: 'posts:create', resource: 'posts', action: 'create' },
  { name: 'posts:read', resource: 'posts', action: 'read' },
  { name: 'posts:update', resource: 'posts', action: 'update' },
  { name: 'posts:delete', resource: 'posts', action: 'delete' },
];
```

### Rules

- Use `resource:action` naming for permissions (e.g., `users:create`, `posts:delete`)
- Use junction tables (`role_permissions`, `user_roles`) for many-to-many relationships
- One role should be marked `isDefault: true` — assigned to new users automatically
- Seed default roles and permissions in migrations or seed scripts — not at runtime
- Users can have multiple roles — permissions are the union of all assigned role permissions
- Always `cascade` deletes on junction tables to prevent orphaned records
