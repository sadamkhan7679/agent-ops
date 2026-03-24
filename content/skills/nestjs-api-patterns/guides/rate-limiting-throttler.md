---
title: Rate Limiting with Throttler
tags: rate-limiting, throttler, protection, guard
---

## Rate Limiting with Throttler

Use `@nestjs/throttler` to protect APIs from abuse and ensure fair resource distribution.

### Setup

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1_000,    // 1 second window
        limit: 3,       // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10_000,   // 10 second window
        limit: 20,      // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60_000,   // 1 minute window
        limit: 100,     // 100 requests per minute
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Per-Route Overrides

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // Strict rate limit on login — prevent brute force
  @Post('login')
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Skip throttling for public health checks
  @Get('status')
  @SkipThrottle()
  status() {
    return { status: 'ok' };
  }
}

// Skip throttling for entire controller
@Controller('webhooks')
@SkipThrottle()
export class WebhooksController {}
```

### Redis-Backed Throttler (Multi-Instance)

```typescript
// app.module.ts
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: 'short', ttl: 1_000, limit: 3 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ],
    storage: new ThrottlerStorageRedisService({
      host: config.get('redis.host'),
      port: config.get('redis.port'),
    }),
  }),
}),
```

### Custom Throttle Key (by User)

```typescript
// common/guards/user-throttler.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by authenticated user ID, fallback to IP
    return req.user?.id ?? req.ip;
  }
}
```

### Rules

- Use multiple time windows (short + long) for layered protection
- Apply strict limits on auth endpoints (login, register, password reset)
- Use `@SkipThrottle()` for webhooks and internal health checks
- Use Redis storage when running multiple app instances — in-memory only works for single instance
- Customize `getTracker` to rate limit by user ID instead of IP for authenticated endpoints
- Return `429 Too Many Requests` with `Retry-After` header (handled automatically by throttler)
