---
title: Fine-Grained Permissions
tags: permissions, granular, resource-action, authorization
---

## Fine-Grained Permissions

Implement `resource:action` permission checks for precise access control beyond simple roles.

### Permission Constants

```typescript
// common/constants/permissions.ts
export const Permissions = {
  Users: {
    Create: 'users:create',
    Read: 'users:read',
    Update: 'users:update',
    Delete: 'users:delete',
    ManageRoles: 'users:manage-roles',
  },
  Posts: {
    Create: 'posts:create',
    Read: 'posts:read',
    Update: 'posts:update',
    UpdateAny: 'posts:update-any',
    Delete: 'posts:delete',
    DeleteAny: 'posts:delete-any',
    Publish: 'posts:publish',
  },
  Orders: {
    Create: 'orders:create',
    Read: 'orders:read',
    ReadAny: 'orders:read-any',
    Update: 'orders:update',
    Cancel: 'orders:cancel',
    Refund: 'orders:refund',
  },
} as const;
```

### RequirePermissions Decorator

```typescript
// common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

### Controller Usage

```typescript
@Controller('posts')
export class PostsController {
  @Get()
  @RequirePermissions(Permissions.Posts.Read)
  findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Post()
  @RequirePermissions(Permissions.Posts.Create)
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.postsService.create(user.id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(Permissions.Posts.Publish)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.publish(id);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.Posts.Delete, Permissions.Posts.DeleteAny)
  // User needs Delete (own) OR DeleteAny — guard checks any match
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }
}
```

### Permission Check in Services

```typescript
@Injectable()
export class OrdersService {
  async findById(orderId: string, currentUser: AuthUser, permissions: string[]) {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) throw new NotFoundException();

    // Can read any order with read-any permission
    if (permissions.includes(Permissions.Orders.ReadAny)) {
      return order;
    }

    // Otherwise, can only read own orders
    if (order.userId !== currentUser.id) {
      throw new ForbiddenException();
    }

    return order;
  }
}
```

### Rules

- Use `resource:action` format for all permissions — consistent and grep-able
- Define permissions as typed constants — avoid magic strings
- Distinguish between "own resource" and "any resource" actions: `posts:update` vs `posts:update-any`
- Guard-level checks handle route access, service-level checks handle data-level access
- Multiple permissions in `@RequirePermissions()` means OR — user needs any one
- Keep permissions flat — don't create nested hierarchies beyond `resource:action`
