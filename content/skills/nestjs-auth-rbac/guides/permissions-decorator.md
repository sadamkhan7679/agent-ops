---
title: Permissions Decorator Patterns
tags: permissions, decorator, metadata, composable
---

## Permissions Decorator Patterns

Create composable decorators that combine auth, roles, and permissions for clean controller code.

### Composed Auth Decorator

```typescript
// common/decorators/auth.decorator.ts
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

export function Auth(...permissions: string[]) {
  return applyDecorators(
    SetMetadata('permissions', permissions),
    UseGuards(JwtAuthGuard, PermissionsGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

// Usage — clean, single decorator
@Controller('users')
export class UsersController {
  @Get()
  @Auth(Permissions.Users.Read)
  findAll() {}

  @Post()
  @Auth(Permissions.Users.Create)
  create(@Body() dto: CreateUserDto) {}

  @Delete(':id')
  @Auth(Permissions.Users.Delete)
  remove(@Param('id', ParseUUIDPipe) id: string) {}
}
```

### Admin-Only Decorator

```typescript
export function AdminOnly() {
  return applyDecorators(
    Roles('admin'),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Admin access required' }),
  );
}

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @AdminOnly()
  getDashboard() {}
}
```

### Resource Owner Decorator

```typescript
// common/decorators/owner-or-permission.decorator.ts
export function OwnerOrPermission(permission: string) {
  return applyDecorators(
    SetMetadata('ownerPermission', permission),
    UseGuards(JwtAuthGuard, OwnerOrPermissionGuard),
    ApiBearerAuth(),
  );
}

// Guard implementation
@Injectable()
export class OwnerOrPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<string>('ownerPermission', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id ?? request.params.userId;

    // Owner check
    if (user.id === resourceId) return true;

    // Permission check
    const permissions: string[] = request.permissions ?? [];
    if (permission && permissions.includes(permission)) return true;

    throw new ForbiddenException();
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Get(':id/profile')
  @OwnerOrPermission(Permissions.Users.Read)
  getProfile(@Param('id', ParseUUIDPipe) id: string) {}
}
```

### Rules

- Use `applyDecorators()` to combine auth, Swagger, and permission decorators into one
- Create domain-specific decorators like `@AdminOnly()`, `@Auth()`, `@OwnerOrPermission()`
- Keep composed decorators in `common/decorators/` for reuse across controllers
- Include Swagger decorators in composed decorators — auth requirements auto-documented
- Prefer composed decorators over stacking 3-4 individual decorators on every route
- Keep guard logic in guards, not in decorators — decorators only set metadata
