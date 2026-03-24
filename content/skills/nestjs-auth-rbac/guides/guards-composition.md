---
title: Guard Composition (AND/OR Logic)
tags: guards, composition, and-or, multiple
---

## Guard Composition (AND/OR Logic)

Combine multiple guards with AND/OR logic for complex authorization requirements.

### AND Logic (Default Behavior)

```typescript
// Multiple global guards run sequentially — ALL must pass (AND)
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },      // must be authenticated
    { provide: APP_GUARD, useClass: RolesGuard },         // must have required role
    { provide: APP_GUARD, useClass: ThrottlerGuard },     // must not be rate-limited
  ],
})
export class AppModule {}

// Route-level: multiple @UseGuards also runs as AND
@Post()
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
create(@Body() dto: CreateDto) {}
```

### OR Logic (Custom Composite Guard)

```typescript
// common/guards/any-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT first
    try {
      const jwtResult = await this.jwtGuard.canActivate(context);
      if (jwtResult) return true;
    } catch {}

    // Fall back to API key
    try {
      const apiKeyResult = await this.apiKeyGuard.canActivate(context);
      if (apiKeyResult) return true;
    } catch {}

    return false;
  }
}

// Usage: authenticate with JWT OR API key
@Controller('api')
@UseGuards(AnyAuthGuard)
export class ApiController {}
```

### Role + Ownership Guard

```typescript
// common/guards/owner-or-admin.guard.ts
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceUserId = request.params.userId ?? request.params.id;

    // Admins can access anything
    if (user.role === 'admin') return true;

    // Users can only access their own resources
    if (user.id === resourceUserId) return true;

    throw new ForbiddenException('You can only access your own resources');
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Get(':id/profile')
  @UseGuards(OwnerOrAdminGuard)
  getProfile(@Param('id', ParseUUIDPipe) id: string) {}

  @Patch(':id')
  @UseGuards(OwnerOrAdminGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {}
}
```

### Conditional Guard Factory

```typescript
// common/guards/require-any-role.guard.ts
export function RequireAnyRole(...roles: string[]) {
  @Injectable()
  class RoleCheckGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const user = context.switchToHttp().getRequest().user;
      return roles.includes(user?.role);
    }
  }

  return mixin(RoleCheckGuard);
}

// Usage
@Post()
@UseGuards(RequireAnyRole('admin', 'editor'))
create() {}
```

### Rules

- Multiple `@UseGuards(A, B, C)` or global guards run as AND — all must pass
- For OR logic, create a composite guard that tries each sub-guard and succeeds if any passes
- Owner-or-admin is a common pattern — check resource ownership with admin bypass
- Use `mixin()` for parameterized guard factories to preserve DI scope
- Keep guard logic simple — complex authorization should be in a service, not a guard
- Always handle guard errors gracefully — catch exceptions in composite guards
