---
title: JWT Passport Strategy
tags: jwt, passport, strategy, authentication
---

## JWT Passport Strategy

Configure Passport JWT strategy for stateless authentication in NestJS.

### Strategy Implementation

```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.jwtSecret'),
    });
  }

  // Called after JWT is verified — return value becomes req.user
  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Extract from Cookie (Alternative)

```typescript
@Injectable()
export class JwtCookieStrategy extends PassportStrategy(Strategy, 'jwt-cookie') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req) => req?.cookies?.access_token ?? null,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('auth.jwtSecret'),
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Auth Module Registration

```typescript
// modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: config.get<string>('auth.jwtExpiresIn', '15m') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Rules

- Keep JWT payloads small: user ID, email, role — avoid embedding full user objects
- Set short expiration (15m) for access tokens — use refresh tokens for longevity
- Never store sensitive data in JWT (passwords, secrets) — JWTs are base64, not encrypted
- Use `ExtractJwt.fromAuthHeaderAsBearerToken()` for API clients, cookies for browser apps
- The `validate()` return value becomes `req.user` — shape it for downstream consumption
- Store JWT secret in environment variables — never hardcode
