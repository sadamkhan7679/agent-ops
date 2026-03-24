---
title: Token Revocation and Blacklisting
tags: refresh, revocation, blacklist, logout
---

## Token Revocation and Blacklisting

Revoke access and refresh tokens for logout, password change, and security incidents.

### Access Token Blacklist (Redis)

```typescript
// modules/auth/token-blacklist.service.ts
@Injectable()
export class TokenBlacklistService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async blacklist(jti: string, expiresInMs: number) {
    // Store until the token would naturally expire
    await this.cache.set(`blacklist:${jti}`, true, expiresInMs);
  }

  async isBlacklisted(jti: string): Promise<boolean> {
    const result = await this.cache.get(`blacklist:${jti}`);
    return result === true;
  }
}
```

### JWT with JTI (Token ID)

```typescript
// Include jti in token payload for individual revocation
async generateAccessToken(userId: string, email: string, role: string) {
  const jti = randomUUID();

  return this.jwtService.signAsync({
    sub: userId,
    email,
    role,
    jti,
  });
}

// JWT Strategy validates blacklist
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly blacklist: TokenBlacklistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('auth.jwtSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (payload.jti && await this.blacklist.isBlacklisted(payload.jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Logout and Revocation Flows

```typescript
@Injectable()
export class AuthService {
  // Single device logout
  async logout(accessToken: string, refreshToken: string) {
    // Decode access token to get jti and expiry
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;
    if (decoded?.jti && decoded?.exp) {
      const expiresInMs = decoded.exp * 1000 - Date.now();
      if (expiresInMs > 0) {
        await this.blacklistService.blacklist(decoded.jti, expiresInMs);
      }
    }

    // Revoke refresh token
    if (refreshToken) {
      await this.refreshTokenService.revokeToken(refreshToken);
    }
  }

  // All devices logout — revoke all refresh tokens
  async logoutAllDevices(userId: string) {
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  // On password change — revoke everything
  async onPasswordChange(userId: string) {
    await this.logoutAllDevices(userId);
    // Note: access tokens will expire naturally (15m max)
    // For immediate revocation, blacklist all active JTIs
  }
}
```

### Cleanup Job

```typescript
// modules/auth/tasks/cleanup-tokens.task.ts
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenCleanupTask {
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanExpiredTokens() {
    const deleted = await this.db
      .delete(refreshTokens)
      .where(lt(refreshTokens.expiresAt, new Date()))
      .returning({ id: refreshTokens.id });

    this.logger.log(`Cleaned up ${deleted.length} expired refresh tokens`);
  }
}
```

### Rules

- Blacklist access tokens in Redis — TTL matches remaining token lifetime (auto-cleanup)
- Include `jti` (JWT ID) in access tokens for individual revocation capability
- Revoke all refresh tokens on password change or security incident
- "Logout all devices" = revoke all refresh tokens for the user
- Access tokens can't be immediately revoked without a blacklist check on every request
- Schedule cleanup jobs to remove expired refresh tokens from the database
