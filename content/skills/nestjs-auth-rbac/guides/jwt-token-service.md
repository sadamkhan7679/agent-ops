---
title: Token Generation Service
tags: jwt, tokens, generation, service
---

## Token Generation Service

Centralize token creation and validation in a dedicated service.

### Auth Service

```typescript
// modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { verify } from 'argon2';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await verify(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const user = await this.usersService.create(dto);
    return this.generateTokens(user.id, user.email, user.role);
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: this.config.get('auth.jwtExpiresIn', '15m'),
      }),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' },
        {
          secret: this.config.get('auth.refreshSecret'),
          expiresIn: this.config.get('auth.refreshExpiresIn', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token: string): Promise<{ sub: string }> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.config.get('auth.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

### Auth Controller

```typescript
// modules/auth/auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: AuthUser) {
    return this.authService.logout(user.id);
  }
}
```

### Rules

- Use the same error message for invalid email and wrong password — prevents user enumeration
- Generate access and refresh tokens in parallel with `Promise.all`
- Use different secrets for access and refresh tokens — separate compromise blast radius
- Keep access tokens short-lived (15m), refresh tokens longer (7d)
- Use `argon2` for password verification — preferred over bcrypt for modern applications
- Return both tokens from login/register — client stores refresh token securely
