---
title: Resource Ownership Checks
tags: permissions, ownership, resource, authorization
---

## Resource Ownership Checks

Verify that users can only access or modify resources they own, unless they have elevated permissions.

### Ownership Service

```typescript
// modules/auth/ownership.service.ts
@Injectable()
export class OwnershipService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  // Map of resource type to table and owner column
  private readonly resourceMap = {
    post: { table: posts, ownerColumn: posts.authorId },
    comment: { table: comments, ownerColumn: comments.authorId },
    order: { table: orders, ownerColumn: orders.userId },
  } as const;

  async isOwner(
    resourceType: keyof typeof this.resourceMap,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    const config = this.resourceMap[resourceType];
    if (!config) return false;

    const [record] = await this.db
      .select({ ownerId: config.ownerColumn })
      .from(config.table)
      .where(eq((config.table as any).id, resourceId));

    return record?.ownerId === userId;
  }
}
```

### Ownership Guard

```typescript
// common/guards/resource-owner.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface ResourceOwnerOptions {
  resourceType: string;
  idParam?: string;            // route param name, default 'id'
  adminBypass?: boolean;       // admins skip ownership check
  bypassPermission?: string;  // specific permission to bypass
}

export const RESOURCE_OWNER_KEY = 'resourceOwner';
export const CheckOwnership = (options: ResourceOwnerOptions) =>
  SetMetadata(RESOURCE_OWNER_KEY, options);

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownershipService: OwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<ResourceOwnerOptions>(
      RESOURCE_OWNER_KEY,
      context.getHandler(),
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[options.idParam ?? 'id'];

    // Admin bypass
    if (options.adminBypass && user.role === 'admin') {
      return true;
    }

    // Permission bypass
    if (options.bypassPermission) {
      const permissions: string[] = request.permissions ?? [];
      if (permissions.includes(options.bypassPermission)) return true;
    }

    // Ownership check
    const isOwner = await this.ownershipService.isOwner(
      options.resourceType as any,
      resourceId,
      user.id,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }
}
```

### Usage

```typescript
@Controller('posts')
export class PostsController {
  @Patch(':id')
  @CheckOwnership({
    resourceType: 'post',
    adminBypass: true,
    bypassPermission: Permissions.Posts.UpdateAny,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @CheckOwnership({
    resourceType: 'post',
    bypassPermission: Permissions.Posts.DeleteAny,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.remove(id);
  }
}
```

### Rules

- Ownership checks happen in guards — before the service layer processes the request
- Always provide bypass options for admins or users with elevated permissions
- Use a centralized `OwnershipService` to avoid duplicating ownership queries
- Map resource types to their tables and owner columns in one place
- Combine with `@RequirePermissions()` for layered authorization: must be authenticated + authorized + owner
- For complex ownership (e.g., team members can edit team posts), use the service layer instead of guards
