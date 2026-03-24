---
title: Auth Guard with Public Route Bypass
tags: guards, auth, public, decorator
---

## Auth Guard with Public Route Bypass

Create a global auth guard that protects all routes by default, with a `@Public()` decorator to opt out.

### Public Decorator

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### JWT Auth Guard

```typescript
// common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### Global Registration

```typescript
// app.module.ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### Usage

```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // This route is protected (no @Public)
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }
}

@Controller('health')
@Public() // entire controller is public
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### CurrentUser Decorator

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    return data ? user?.[data] : user;
  },
);

// Usage:
// @CurrentUser() user: AuthUser       → full user object
// @CurrentUser('id') userId: string   → just the ID
```

### Rules

- Register `JwtAuthGuard` globally — all routes are protected by default
- Use `@Public()` to opt specific routes out of authentication
- Use `reflector.getAllAndOverride` to check both handler and class-level metadata
- Create a `@CurrentUser()` decorator to extract the authenticated user cleanly
- Define an `AuthUser` interface for the shape of `req.user` — consistent typing across the app
- Place `@Public()` on auth controller routes (login, register) and health checks
