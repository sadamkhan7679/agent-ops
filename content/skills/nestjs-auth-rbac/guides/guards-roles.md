---
title: Roles Guard and Decorator
tags: guards, roles, decorator, authorization
---

## Roles Guard and Decorator

Restrict route access based on user roles.

### Roles Decorator

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### Roles Guard

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required — allow access
    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
```

### Global Registration (After Auth Guard)

```typescript
// app.module.ts
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },  // runs first
    { provide: APP_GUARD, useClass: RolesGuard },     // runs second
  ],
})
export class AppModule {}
```

### Usage

```typescript
@Controller('admin/users')
@Roles('admin') // all routes in this controller require admin
export class AdminUsersController {
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @Roles('super_admin') // override: requires super_admin
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}

@Controller('posts')
export class PostsController {
  @Get()
  findAll() {} // any authenticated user

  @Post()
  @Roles('admin', 'moderator') // admin OR moderator
  create(@Body() dto: CreatePostDto) {}

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {}
}
```

### Rules

- Register `RolesGuard` after `JwtAuthGuard` — roles check needs `req.user` to be populated
- Use `getAllAndOverride` — handler-level `@Roles()` overrides class-level
- If no `@Roles()` decorator is present, the guard allows access (authenticated but no role requirement)
- Multiple roles in `@Roles('admin', 'moderator')` means OR — user needs any one of them
- Throw `ForbiddenException` (403) for authorization failures, not `UnauthorizedException` (401)
- Keep role strings as constants — avoid magic strings scattered across controllers
