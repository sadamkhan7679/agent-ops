---
title: Brute Force Protection
tags: security, brute-force, lockout, rate-limit
---

## Brute Force Protection

Protect login endpoints from brute force attacks with progressive delays and account lockout.

### Login Attempt Tracking

```typescript
// modules/auth/login-attempts.service.ts
@Injectable()
export class LoginAttemptsService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private readonly ATTEMPT_WINDOW_MS = 60 * 60 * 1000;   // 1 hour

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  private key(identifier: string) {
    return `login_attempts:${identifier}`;
  }

  async recordFailedAttempt(identifier: string): Promise<{
    attemptsRemaining: number;
    lockedUntil: Date | null;
  }> {
    const key = this.key(identifier);
    const data = await this.cache.get<{ count: number; firstAttempt: number }>(key);

    const now = Date.now();
    const count = data ? data.count + 1 : 1;
    const firstAttempt = data?.firstAttempt ?? now;

    await this.cache.set(key, { count, firstAttempt }, this.ATTEMPT_WINDOW_MS);

    if (count >= this.MAX_ATTEMPTS) {
      const lockKey = `lockout:${identifier}`;
      await this.cache.set(lockKey, true, this.LOCKOUT_DURATION_MS);

      return {
        attemptsRemaining: 0,
        lockedUntil: new Date(now + this.LOCKOUT_DURATION_MS),
      };
    }

    return {
      attemptsRemaining: this.MAX_ATTEMPTS - count,
      lockedUntil: null,
    };
  }

  async isLocked(identifier: string): Promise<boolean> {
    return (await this.cache.get(`lockout:${identifier}`)) === true;
  }

  async resetAttempts(identifier: string) {
    await this.cache.del(this.key(identifier));
    await this.cache.del(`lockout:${identifier}`);
  }
}
```

### Integration with Auth Service

```typescript
@Injectable()
export class AuthService {
  async login(email: string, password: string, ip: string): Promise<AuthTokens> {
    // Check lockout by both email and IP
    const isEmailLocked = await this.loginAttempts.isLocked(email);
    const isIpLocked = await this.loginAttempts.isLocked(ip);

    if (isEmailLocked || isIpLocked) {
      throw new HttpException(
        'Account temporarily locked. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.usersService.findByEmail(email);
    if (!user || !(await verifyPassword(user.passwordHash, password))) {
      // Record failed attempt for both email and IP
      await this.loginAttempts.recordFailedAttempt(email);
      await this.loginAttempts.recordFailedAttempt(ip);

      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset attempts on successful login
    await this.loginAttempts.resetAttempts(email);
    await this.loginAttempts.resetAttempts(ip);

    return this.generateTokens(user.id, user.email, user.role);
  }
}
```

### Rules

- Track attempts by both email AND IP — prevents targeting a single account or rotating accounts
- Lock accounts after 5 failed attempts for 15 minutes — progressive delays
- Store attempt counts in Redis/cache with TTL — auto-cleanup, no database bloat
- Reset attempts on successful login — don't penalize legitimate users
- Return generic error messages — don't reveal whether the email exists
- Log lockout events for security monitoring and incident response
