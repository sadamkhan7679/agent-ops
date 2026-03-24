---
title: Passport Session Serialization
tags: session, serialization, passport, user
---

## Passport Session Serialization

Configure how Passport stores and retrieves user data from sessions.

### Serializer

```typescript
// modules/auth/session.serializer.ts
import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  // Called after login — store minimal data in session
  serializeUser(user: any, done: (err: Error | null, id?: string) => void) {
    done(null, user.id); // only store user ID in session
  }

  // Called on every request with a session — reconstruct user
  async deserializeUser(userId: string, done: (err: Error | null, user?: any) => void) {
    try {
      const user = await this.usersService.findById(userId);
      if (!user) {
        return done(null, null);
      }
      // Return only what downstream code needs
      done(null, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (err) {
      done(err as Error);
    }
  }
}
```

### Auth Module Registration

```typescript
// modules/auth/auth.module.ts
@Module({
  imports: [PassportModule.register({ session: true })],
  providers: [
    AuthService,
    LocalStrategy,
    SessionSerializer,
  ],
})
export class AuthModule {}
```

### Cached Deserialization

```typescript
@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {
    super();
  }

  serializeUser(user: any, done: (err: Error | null, id?: string) => void) {
    done(null, user.id);
  }

  async deserializeUser(userId: string, done: (err: Error | null, user?: any) => void) {
    try {
      const cacheKey = `session:user:${userId}`;
      let user = await this.cache.get(cacheKey);

      if (!user) {
        user = await this.usersService.findById(userId);
        if (user) {
          await this.cache.set(cacheKey, user, 60_000); // 1 min cache
        }
      }

      done(null, user ?? null);
    } catch (err) {
      done(err as Error);
    }
  }
}
```

### Rules

- Serialize only the user ID to the session — keep session data minimal
- Deserialize on each request to get fresh user data (roles may have changed)
- Cache deserialized users to avoid a DB query on every request
- Invalidate the session cache when user roles or permissions change
- Register `PassportModule.register({ session: true })` when using session auth
- Return `null` from `deserializeUser` if user not found — Passport treats this as unauthenticated
