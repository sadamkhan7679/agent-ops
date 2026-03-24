---
title: Custom Rate Limiting
tags: rate-limiting, custom, sliding-window, api-keys
---

## Custom Rate Limiting

Implement custom rate limiting for advanced scenarios like per-API-key limits and tiered plans.

### Tiered Rate Limiting

```typescript
// common/guards/tiered-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

const PLAN_LIMITS: Record<string, { limit: number; ttl: number }> = {
  free: { limit: 100, ttl: 3600_000 },       // 100/hour
  pro: { limit: 1000, ttl: 3600_000 },       // 1000/hour
  enterprise: { limit: 10000, ttl: 3600_000 }, // 10000/hour
};

@Injectable()
export class TieredThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.headers['x-api-key'] ?? req.ip;
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest();
    const plan = request.user?.plan ?? 'free';
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    // Override limits based on user plan
    requestProps.limit = limits.limit;
    requestProps.ttl = limits.ttl;

    return super.handleRequest(requestProps);
  }
}
```

### API Key Rate Limiting

```typescript
// common/guards/api-key-rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) return true; // Let auth guard handle missing keys

    const key = `rate:${apiKey}`;
    const windowMs = 60_000; // 1 minute

    const current = await this.cache.get<number>(key) ?? 0;
    const limit = 60; // 60 requests per minute

    if (current >= limit) {
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('Retry-After', 60);

      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.cache.set(key, current + 1, windowMs);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', limit - current - 1);

    return true;
  }
}
```

### Rate Limit Response Headers

```typescript
// common/interceptors/rate-limit-headers.interceptor.ts
@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();

    // Headers set by guards are preserved
    // Add standard headers if not already set
    if (!response.getHeader('X-RateLimit-Limit')) {
      response.setHeader('X-RateLimit-Limit', 100);
    }

    return next.handle();
  }
}
```

### Rules

- Use `@nestjs/throttler` for standard rate limiting — build custom only for tiered/API-key scenarios
- Always include rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- Use Redis for rate limit counters in multi-instance deployments
- Implement tiered limits based on user plan — free, pro, enterprise
- Rate limit by API key or user ID, not just IP — shared IPs cause unfair blocking
- Log rate limit violations for abuse detection and capacity planning
