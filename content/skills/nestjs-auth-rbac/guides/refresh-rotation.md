---
title: Refresh Token Rotation
tags: refresh, rotation, token-family, security
---

## Refresh Token Rotation

Rotate refresh tokens on each use to limit the window of compromise.

### Token Family Schema

```typescript
// shared/database/schema/refresh-tokens.schema.ts
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  family: uuid('family').notNull(), // group tokens from same login session
  isRevoked: boolean('is_revoked').notNull().default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### Token Rotation Service

```typescript
// modules/auth/refresh-token.service.ts
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class RefreshTokenService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async createToken(userId: string, family?: string): Promise<string> {
    const token = randomBytes(64).toString('base64url');
    const tokenHash = this.hashToken(token);

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      family: family ?? randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return token;
  }

  async rotateToken(oldToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const oldHash = this.hashToken(oldToken);

    return this.db.transaction(async (tx) => {
      // Find the existing token
      const [existing] = await tx
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, oldHash));

      if (!existing) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (existing.isRevoked) {
        // Token reuse detected! Revoke entire family
        await tx
          .update(refreshTokens)
          .set({ isRevoked: true })
          .where(eq(refreshTokens.family, existing.family));

        throw new UnauthorizedException('Token reuse detected — all sessions revoked');
      }

      if (existing.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Revoke the old token
      await tx
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.id, existing.id));

      // Issue new tokens in the same family
      const newRefreshToken = randomBytes(64).toString('base64url');
      await tx.insert(refreshTokens).values({
        userId: existing.userId,
        tokenHash: this.hashToken(newRefreshToken),
        family: existing.family,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Generate new access token
      const user = await tx.query.users.findFirst({
        where: eq(users.id, existing.userId),
      });

      const accessToken = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      return { accessToken, refreshToken: newRefreshToken };
    });
  }
}
```

### Rules

- Store only the hash of refresh tokens in the database — never store tokens in plain text
- Use token families to group tokens from the same login session
- On rotation: revoke old token, issue new token in the same family
- On reuse of a revoked token: revoke the entire family (indicates theft)
- Set expiration on refresh tokens — 7-30 days depending on security requirements
- Clean up expired tokens with a scheduled job to prevent table bloat
