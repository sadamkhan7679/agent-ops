---
title: Request-Level Role Resolution
tags: rbac, middleware, interceptor, request
---

## Request-Level Role Resolution

Attach permissions to the request early so guards and services can check them without repeated DB queries.

### Permissions Interceptor

```typescript
// common/interceptors/permissions.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RbacService } from '@/modules/auth/rbac.service';

@Injectable()
export class PermissionsInterceptor implements NestInterceptor {
  constructor(private readonly rbacService: RbacService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.id) {
      // Attach permissions to request for downstream use
      request.permissions = await this.rbacService.getUserPermissions(user.id);
    }

    return next.handle();
  }
}
```

### Global Registration

```typescript
// app.module.ts
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: PermissionsInterceptor },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
```

### Permissions Guard (Using Pre-Loaded Permissions)

```typescript
// common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const userPermissions: string[] = request.permissions ?? [];

    const hasPermission = required.some((p) => userPermissions.includes(p));
    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permission: ${required.join(' or ')}`,
      );
    }

    return true;
  }
}
```

### Accessing Permissions in Services

```typescript
// Use @Inject(REQUEST) to access request-scoped permissions
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class PostsService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  async update(postId: string, dto: UpdatePostDto) {
    const post = await this.postsRepo.findById(postId);
    const permissions = (this.request as any).permissions as string[];

    // Non-admins can only edit their own posts
    if (!permissions.includes('posts:update-any') && post.authorId !== this.request.user.id) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.postsRepo.update(postId, dto);
  }
}
```

### Rules

- Load permissions once per request in an interceptor — avoids repeated DB/cache queries
- Interceptors run after guards, so `JwtAuthGuard` must populate `req.user` first
- The permissions guard reads from `req.permissions` (pre-loaded), not from the database
- Use request-scoped services when business logic needs permission checks beyond guards
- Order matters: Auth Guard → Permissions Interceptor → Roles/Permissions Guard
- Keep permissions as a flat string array on the request — simple and fast to check
