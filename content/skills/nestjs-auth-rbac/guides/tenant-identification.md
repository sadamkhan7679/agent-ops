---
title: Tenant Identification
tags: multi-tenancy, tenant, identification, middleware
---

## Tenant Identification

Identify the current tenant from subdomain, header, or JWT claim in multi-tenant applications.

### Tenant Middleware

```typescript
// common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.resolveTenant(req);

    if (!tenantId) {
      throw new BadRequestException('Tenant identification required');
    }

    // Attach to request for downstream use
    (req as any).tenantId = tenantId;
    next();
  }

  private resolveTenant(req: Request): string | null {
    // Strategy 1: Custom header
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) return headerTenant;

    // Strategy 2: Subdomain
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }

    // Strategy 3: JWT claim (if authenticated)
    const user = (req as any).user;
    if (user?.tenantId) return user.tenantId;

    return null;
  }
}
```

### Tenant Decorator

```typescript
// common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

### Tenant Guard

```typescript
// common/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant not identified');
    }

    // Verify tenant exists and is active
    const tenant = await this.db.query.tenants.findFirst({
      where: and(eq(tenants.id, tenantId), eq(tenants.isActive, true)),
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found or inactive');
    }

    request.tenant = tenant;
    return true;
  }
}
```

### Usage

```typescript
@Controller('projects')
export class ProjectsController {
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.projectsService.findByTenant(tenantId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenantId, user.id, dto);
  }
}
```

### Rules

- Resolve tenant as early as possible — middleware runs before guards and interceptors
- Support multiple identification strategies (header, subdomain, JWT) with fallback chain
- Validate that the tenant exists and is active before processing the request
- Attach `tenantId` to the request object for use throughout the request lifecycle
- Create a `@CurrentTenant()` decorator for clean access in controllers
- Fail loudly if tenant can't be identified — never default to a tenant silently
