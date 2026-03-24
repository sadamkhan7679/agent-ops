---
title: Google OAuth2 Integration
tags: oauth, google, social, passport
---

## Google OAuth2 Integration

Implement Google sign-in with Passport OAuth2 strategy.

### Setup

```bash
pnpm add passport-google-oauth20 @nestjs/passport
pnpm add -D @types/passport-google-oauth20
```

### Google Strategy

```typescript
// modules/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('oauth.google.clientId'),
      clientSecret: config.get('oauth.google.clientSecret'),
      callbackURL: config.get('oauth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { emails, displayName, photos, id } = profile;

    const user = {
      providerId: id,
      provider: 'google',
      email: emails?.[0]?.value,
      name: displayName,
      avatarUrl: photos?.[0]?.value,
    };

    done(null, user);
  }
}
```

### OAuth Controller

```typescript
// modules/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @Public()
  googleLogin() {
    // Redirects to Google consent screen
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Public()
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // req.user contains the profile from GoogleStrategy.validate()
    const tokens = await this.authService.handleOAuthLogin(req.user);

    // Redirect to frontend with tokens
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    res.redirect(`${this.config.get('app.frontendUrl')}/auth/callback?${params}`);
  }
}
```

### OAuth User Service

```typescript
// modules/auth/auth.service.ts
async handleOAuthLogin(profile: OAuthProfile): Promise<AuthTokens> {
  // Check if user exists with this OAuth provider
  let user = await this.usersService.findByProvider(profile.provider, profile.providerId);

  if (!user) {
    // Check if email exists (link account)
    const existingUser = await this.usersService.findByEmail(profile.email);

    if (existingUser) {
      // Link OAuth to existing account
      await this.usersService.linkProvider(existingUser.id, {
        provider: profile.provider,
        providerId: profile.providerId,
      });
      user = existingUser;
    } else {
      // Create new user
      user = await this.usersService.createFromOAuth(profile);
    }
  }

  return this.generateTokens(user.id, user.email, user.role);
}
```

### OAuth Providers Schema

```typescript
// shared/database/schema/oauth-accounts.schema.ts
export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(), // 'google', 'github'
    providerId: varchar('provider_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('oauth_provider_id_idx').on(table.provider, table.providerId),
  ],
);
```

### Rules

- Store OAuth provider data in a separate `oauth_accounts` table — users can have multiple providers
- Always check for existing email before creating a new user — prevents duplicate accounts
- Redirect to frontend after OAuth callback with tokens as query params or set cookies
- Never expose OAuth client secrets — store in environment variables
- Request minimal scopes (`email`, `profile`) — only ask for what you need
- Handle the case where Google email matches an existing account (auto-link)
