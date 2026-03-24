---
title: RBAC Service with Role Hierarchy
tags: rbac, service, hierarchy, authorization
---

## RBAC Service with Role Hierarchy

Implement role-based authorization with optional hierarchy support.

### RBAC Service

```typescript
// modules/auth/rbac.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DRIZZLE, DrizzleDB } from '@/shared/database/drizzle.provider';
import { userRoles, rolePermissions, roles, permissions } from '@/shared/database/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class RbacService {
  // Role hierarchy: higher roles inherit lower role permissions
  private readonly roleHierarchy: Record<string, string[]> = {
    admin: ['editor', 'viewer'],
    editor: ['viewer'],
    viewer: [],
  };

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user:${userId}:permissions`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    // Get user's roles
    const userRoleRecords = await this.db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: { role: true },
    });

    const roleNames = userRoleRecords.map((ur) => ur.role.name);

    // Expand with hierarchy
    const allRoles = new Set<string>();
    for (const roleName of roleNames) {
      allRoles.add(roleName);
      const inherited = this.roleHierarchy[roleName] ?? [];
      inherited.forEach((r) => allRoles.add(r));
    }

    // Get all permissions for expanded roles
    const roleRecords = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(inArray(roles.name, [...allRoles]));

    const roleIds = roleRecords.map((r) => r.id);
    if (roleIds.length === 0) return [];

    const perms = await this.db
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    const permissionNames = [...new Set(perms.map((p) => p.name))];

    await this.cache.set(cacheKey, permissionNames, 300_000); // 5 min cache
    return permissionNames;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.some((p) => permissions.includes(p));
  }

  async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((p) => permissions.includes(p));
  }

  async invalidateUserCache(userId: string) {
    await this.cache.del(`user:${userId}:permissions`);
  }
}
```

### Assigning Roles

```typescript
@Injectable()
export class RolesService {
  async assignRole(userId: string, roleName: string) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    await this.db
      .insert(userRoles)
      .values({ userId, roleId: role.id })
      .onConflictDoNothing();

    await this.rbacService.invalidateUserCache(userId);
  }

  async removeRole(userId: string, roleName: string) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });
    if (!role) return;

    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)));

    await this.rbacService.invalidateUserCache(userId);
  }
}
```

### Rules

- Cache user permissions — don't query the database on every request
- Invalidate permission cache when roles or permissions change
- Use role hierarchy to reduce permission duplication (admin inherits editor inherits viewer)
- Provide `hasAnyPermission` (OR) and `hasAllPermissions` (AND) for flexible checks
- Keep role hierarchy configuration simple — deep hierarchies are hard to reason about
- Use `onConflictDoNothing` when assigning roles to handle idempotent operations
