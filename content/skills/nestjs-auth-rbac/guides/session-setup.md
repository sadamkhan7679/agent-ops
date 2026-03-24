---
title: Session Authentication Setup
tags: session, redis, express-session, passport
---

## Session Authentication Setup

Configure server-side session authentication with Redis store for traditional web applications.

### Setup

```typescript
// main.ts
import * as session from 'express-session';
import * as passport from 'passport';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Redis client
  const redisClient = createClient({
    url: config.get('redis.url'),
  });
  await redisClient.connect();

  // Session middleware
  app.use(
    session({
      store: new RedisStore({ client: redisClient }),
      secret: config.get('session.secret'),
      resave: false,
      saveUninitialized: false,
      rolling: true, // refresh expiry on activity
      cookie: {
        httpOnly: true,
        secure: config.get('app.isProd'),
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Passport session
  app.use(passport.initialize());
  app.use(passport.session());

  await app.listen(3000);
}
```

### Local Strategy

```typescript
// modules/auth/strategies/local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user; // this becomes req.user and gets serialized to session
  }
}
```

### Session Guard

```typescript
// common/guards/session-auth.guard.ts
@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.isAuthenticated();
  }
}

// Login guard triggers Passport local strategy
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

### Controller

```typescript
@Controller('auth')
export class AuthController {
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  login(@Req() req: Request) {
    return { user: req.user, message: 'Login successful' };
  }

  @Post('logout')
  @UseGuards(SessionAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() req: Request) {
    req.logout((err) => {
      if (err) throw err;
    });
  }

  @Get('me')
  @UseGuards(SessionAuthGuard)
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
```

### Rules

- Use Redis for session storage in production — in-memory sessions don't survive restarts
- Set `httpOnly: true`, `secure: true`, `sameSite: 'strict'` on session cookies
- Set `rolling: true` to refresh session expiry on every request (activity-based expiry)
- Use `saveUninitialized: false` to avoid creating sessions for unauthenticated requests
- `req.isAuthenticated()` checks if a session exists — use in session-based guards
- Session auth is better for traditional server-rendered apps; JWT is better for SPAs and APIs
