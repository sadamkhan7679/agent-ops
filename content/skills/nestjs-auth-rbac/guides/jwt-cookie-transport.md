---
title: Secure Cookie Transport
tags: jwt, cookies, httponly, security
---

## Secure Cookie Transport

Store tokens in HTTP-only cookies for browser-based applications to prevent XSS token theft.

### Setting Cookies

```typescript
// modules/auth/auth.controller.ts
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto.email, dto.password);

    this.setTokenCookies(res, tokens);

    return { message: 'Login successful' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token');

    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setTokenCookies(res, tokens);

    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  private setTokenCookies(res: Response, tokens: AuthTokens) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,        // not accessible via JavaScript
      secure: true,          // only sent over HTTPS
      sameSite: 'strict',    // prevents CSRF
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/auth/refresh', // only sent to refresh endpoint
    });
  }
}
```

### Cookie Parser Setup

```typescript
// main.ts
import * as cookieParser from 'cookie-parser';

app.use(cookieParser());
```

### JWT Strategy for Cookies

```typescript
@Injectable()
export class JwtCookieStrategy extends PassportStrategy(Strategy, 'jwt-cookie') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: (req) => req?.cookies?.access_token ?? null,
      ignoreExpiration: false,
      secretOrKey: config.get('auth.jwtSecret'),
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Rules

- Always set `httpOnly: true` — prevents JavaScript access (XSS protection)
- Always set `secure: true` in production — cookies only sent over HTTPS
- Use `sameSite: 'strict'` for same-site apps, `'lax'` if you need cross-site navigation
- Set `path: '/auth/refresh'` on refresh token cookie — limits exposure surface
- Use `@Res({ passthrough: true })` to set cookies while keeping NestJS response handling
- Clear both cookies on logout — don't just invalidate the token server-side
