---
title: GitHub OAuth2 Integration
tags: oauth, github, social, passport
---

## GitHub OAuth2 Integration

Implement GitHub sign-in for developer-facing applications.

### GitHub Strategy

```typescript
// modules/auth/strategies/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('oauth.github.clientId'),
      clientSecret: config.get('oauth.github.clientSecret'),
      callbackURL: config.get('oauth.github.callbackUrl'),
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    const email = profile.emails?.[0]?.value;

    return {
      providerId: profile.id,
      provider: 'github',
      email,
      name: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value,
      username: profile.username,
    };
  }
}
```

### Controller Routes

```typescript
@Controller('auth')
export class AuthController {
  @Get('github')
  @UseGuards(AuthGuard('github'))
  @Public()
  githubLogin() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @Public()
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.handleOAuthLogin(req.user);

    // Set cookies for browser-based flow
    this.setTokenCookies(res, tokens);
    res.redirect(this.config.get('app.frontendUrl'));
  }
}
```

### OAuth Config

```typescript
// config/oauth.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().url().optional(),
});

export const oauthConfig = registerAs('oauth', () => {
  const env = schema.parse(process.env);
  return {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackUrl: env.GOOGLE_CALLBACK_URL,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackUrl: env.GITHUB_CALLBACK_URL,
    },
  };
});
```

### Conditional Strategy Registration

```typescript
// modules/auth/auth.module.ts
const strategies = [LocalStrategy, JwtStrategy];

// Only register OAuth strategies if configured
if (process.env.GOOGLE_CLIENT_ID) {
  strategies.push(GoogleStrategy);
}
if (process.env.GITHUB_CLIENT_ID) {
  strategies.push(GitHubStrategy);
}

@Module({
  providers: [...strategies, AuthService],
})
export class AuthModule {}
```

### Rules

- Request `user:email` scope for GitHub — email may not be in the default profile
- Handle missing email gracefully — some GitHub users have private emails
- Conditionally register OAuth strategies — don't fail if credentials aren't configured
- Use the same `handleOAuthLogin` service method for all providers — DRY
- Store the GitHub username in the user profile for display purposes
- Validate OAuth config with Zod but make all fields optional — not all providers may be enabled
