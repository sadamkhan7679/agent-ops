# Nestjs Auth Rbac — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

Authentication and authorization deep-dive for NestJS covering JWT, sessions, refresh tokens, RBAC, permissions, guards, decorators, OAuth2, multi-tenancy, and security hardening. Use when implementing auth flows, role-based access control, permission systems, or securing NestJS APIs.

## Table of Contents

1. [JWT Authentication: Secure Cookie Transport](#1-secure-cookie-transport)
2. [JWT Authentication: JWT Passport Strategy](#2-jwt-passport-strategy)
3. [JWT Authentication: Token Generation Service](#3-token-generation-service)
4. [Guards & Decorators: Auth Guard with Public Route Bypass](#4-auth-guard-with-public-route-bypass)
5. [Guards & Decorators: Guard Composition (AND/OR Logic)](#5-guard-composition-and-or-logic)
6. [Guards & Decorators: Roles Guard and Decorator](#6-roles-guard-and-decorator)
7. [Role-Based Access Control: Request-Level Role Resolution](#7-request-level-role-resolution)
8. [Role-Based Access Control: RBAC Database Schema](#8-rbac-database-schema)
9. [Role-Based Access Control: RBAC Service with Role Hierarchy](#9-rbac-service-with-role-hierarchy)
10. [Permission System: Permissions Decorator Patterns](#10-permissions-decorator-patterns)
11. [Permission System: Fine-Grained Permissions](#11-fine-grained-permissions)
12. [Permission System: Resource Ownership Checks](#12-resource-ownership-checks)
13. [Refresh Tokens: Token Revocation and Blacklisting](#13-token-revocation-and-blacklisting)
14. [Refresh Tokens: Refresh Token Rotation](#14-refresh-token-rotation)
15. [Session Auth: Passport Session Serialization](#15-passport-session-serialization)
16. [Session Auth: Session Authentication Setup](#16-session-authentication-setup)
17. [OAuth2 & Social: GitHub OAuth2 Integration](#17-github-oauth2-integration)
18. [OAuth2 & Social: Google OAuth2 Integration](#18-google-oauth2-integration)
19. [OAuth2 & Social: Account Linking](#19-account-linking)
20. [Multi-Tenancy: Tenant Identification](#20-tenant-identification)
21. [Multi-Tenancy: Tenant Data Isolation](#21-tenant-data-isolation)
22. [Security Hardening: Brute Force Protection](#22-brute-force-protection)
23. [Security Hardening: CSRF and CORS Configuration](#23-csrf-and-cors-configuration)
24. [Security Hardening: Password Hashing and Validation](#24-password-hashing-and-validation)
25. [Testing Auth: E2E Testing Protected Endpoints](#25-e2e-testing-protected-endpoints)
26. [Testing Auth: Mocking Auth in Unit Tests](#26-mocking-auth-in-unit-tests)

---

## 1. Secure Cookie Transport

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

---

## 2. JWT Passport Strategy

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

---

## 3. Token Generation Service

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

---

## 4. Auth Guard with Public Route Bypass

Create a global auth guard that protects all routes by default, with a `@Public()` decorator to opt out.

### Public Decorator

```typescript
// common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### JWT Auth Guard

```typescript
// common/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

### Global Registration

```typescript
// app.module.ts
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
```

### Usage

```typescript
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // This route is protected (no @Public)
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }
}

@Controller('health')
@Public() // entire controller is public
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### CurrentUser Decorator

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;

    return data ? user?.[data] : user;
  },
);

// Usage:
// @CurrentUser() user: AuthUser       → full user object
// @CurrentUser('id') userId: string   → just the ID
```

### Rules

- Register `JwtAuthGuard` globally — all routes are protected by default
- Use `@Public()` to opt specific routes out of authentication
- Use `reflector.getAllAndOverride` to check both handler and class-level metadata
- Create a `@CurrentUser()` decorator to extract the authenticated user cleanly
- Define an `AuthUser` interface for the shape of `req.user` — consistent typing across the app
- Place `@Public()` on auth controller routes (login, register) and health checks

---

## 5. Guard Composition (AND/OR Logic)

Combine multiple guards with AND/OR logic for complex authorization requirements.

### AND Logic (Default Behavior)

```typescript
// Multiple global guards run sequentially — ALL must pass (AND)
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },      // must be authenticated
    { provide: APP_GUARD, useClass: RolesGuard },         // must have required role
    { provide: APP_GUARD, useClass: ThrottlerGuard },     // must not be rate-limited
  ],
})
export class AppModule {}

// Route-level: multiple @UseGuards also runs as AND
@Post()
@UseGuards(JwtAuthGuard, RolesGuard, IpWhitelistGuard)
create(@Body() dto: CreateDto) {}
```

### OR Logic (Custom Composite Guard)

```typescript
// common/guards/any-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class AnyAuthGuard implements CanActivate {
  constructor(
    private readonly jwtGuard: JwtAuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Try JWT first
    try {
      const jwtResult = await this.jwtGuard.canActivate(context);
      if (jwtResult) return true;
    } catch {}

    // Fall back to API key
    try {
      const apiKeyResult = await this.apiKeyGuard.canActivate(context);
      if (apiKeyResult) return true;
    } catch {}

    return false;
  }
}

// Usage: authenticate with JWT OR API key
@Controller('api')
@UseGuards(AnyAuthGuard)
export class ApiController {}
```

### Role + Ownership Guard

```typescript
// common/guards/owner-or-admin.guard.ts
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceUserId = request.params.userId ?? request.params.id;

    // Admins can access anything
    if (user.role === 'admin') return true;

    // Users can only access their own resources
    if (user.id === resourceUserId) return true;

    throw new ForbiddenException('You can only access your own resources');
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Get(':id/profile')
  @UseGuards(OwnerOrAdminGuard)
  getProfile(@Param('id', ParseUUIDPipe) id: string) {}

  @Patch(':id')
  @UseGuards(OwnerOrAdminGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {}
}
```

### Conditional Guard Factory

```typescript
// common/guards/require-any-role.guard.ts
export function RequireAnyRole(...roles: string[]) {
  @Injectable()
  class RoleCheckGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const user = context.switchToHttp().getRequest().user;
      return roles.includes(user?.role);
    }
  }

  return mixin(RoleCheckGuard);
}

// Usage
@Post()
@UseGuards(RequireAnyRole('admin', 'editor'))
create() {}
```

### Rules

- Multiple `@UseGuards(A, B, C)` or global guards run as AND — all must pass
- For OR logic, create a composite guard that tries each sub-guard and succeeds if any passes
- Owner-or-admin is a common pattern — check resource ownership with admin bypass
- Use `mixin()` for parameterized guard factories to preserve DI scope
- Keep guard logic simple — complex authorization should be in a service, not a guard
- Always handle guard errors gracefully — catch exceptions in composite guards

---

## 6. Roles Guard and Decorator

Restrict route access based on user roles.

### Roles Decorator

```typescript
// common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

### Roles Guard

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required — allow access
    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(
        `Required role: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
```

### Global Registration (After Auth Guard)

```typescript
// app.module.ts
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },  // runs first
    { provide: APP_GUARD, useClass: RolesGuard },     // runs second
  ],
})
export class AppModule {}
```

### Usage

```typescript
@Controller('admin/users')
@Roles('admin') // all routes in this controller require admin
export class AdminUsersController {
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @Roles('super_admin') // override: requires super_admin
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}

@Controller('posts')
export class PostsController {
  @Get()
  findAll() {} // any authenticated user

  @Post()
  @Roles('admin', 'moderator') // admin OR moderator
  create(@Body() dto: CreatePostDto) {}

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {}
}
```

### Rules

- Register `RolesGuard` after `JwtAuthGuard` — roles check needs `req.user` to be populated
- Use `getAllAndOverride` — handler-level `@Roles()` overrides class-level
- If no `@Roles()` decorator is present, the guard allows access (authenticated but no role requirement)
- Multiple roles in `@Roles('admin', 'moderator')` means OR — user needs any one of them
- Throw `ForbiddenException` (403) for authorization failures, not `UnauthorizedException` (401)
- Keep role strings as constants — avoid magic strings scattered across controllers

---

## 7. Request-Level Role Resolution

Attach permissions to the request early so guards and services can check them without repeated DB queries.

### Permissions Interceptor

```typescript
// common/interceptors/permissions.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RbacService } from '@/modules/auth/rbac.service';

@Injectable()
export class PermissionsInterceptor implements NestInterceptor {
  constructor(private readonly rbacService: RbacService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.id) {
      // Attach permissions to request for downstream use
      request.permissions = await this.rbacService.getUserPermissions(user.id);
    }

    return next.handle();
  }
}
```

### Global Registration

```typescript
// app.module.ts
@Module({
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: PermissionsInterceptor },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
```

### Permissions Guard (Using Pre-Loaded Permissions)

```typescript
// common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest();
    const userPermissions: string[] = request.permissions ?? [];

    const hasPermission = required.some((p) => userPermissions.includes(p));
    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permission: ${required.join(' or ')}`,
      );
    }

    return true;
  }
}
```

### Accessing Permissions in Services

```typescript
// Use @Inject(REQUEST) to access request-scoped permissions
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class PostsService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  async update(postId: string, dto: UpdatePostDto) {
    const post = await this.postsRepo.findById(postId);
    const permissions = (this.request as any).permissions as string[];

    // Non-admins can only edit their own posts
    if (!permissions.includes('posts:update-any') && post.authorId !== this.request.user.id) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    return this.postsRepo.update(postId, dto);
  }
}
```

### Rules

- Load permissions once per request in an interceptor — avoids repeated DB/cache queries
- Interceptors run after guards, so `JwtAuthGuard` must populate `req.user` first
- The permissions guard reads from `req.permissions` (pre-loaded), not from the database
- Use request-scoped services when business logic needs permission checks beyond guards
- Order matters: Auth Guard → Permissions Interceptor → Roles/Permissions Guard
- Keep permissions as a flat string array on the request — simple and fast to check

---

## 8. RBAC Database Schema

Design a flexible role and permission schema using Drizzle ORM.

### Schema Definition

```typescript
// shared/database/schema/roles.schema.ts
import { pgTable, uuid, varchar, text, timestamp, primaryKey, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 'admin', 'editor', 'viewer'
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(), // 'users:create', 'posts:delete'
  description: text('description'),
  resource: varchar('resource', { length: 50 }).notNull(),   // 'users', 'posts'
  action: varchar('action', { length: 50 }).notNull(),       // 'create', 'read', 'update', 'delete'
});

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ],
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
  ],
);
```

### Relations

```typescript
// shared/database/schema/relations.ts
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));
```

### Seed Default Roles

```typescript
// shared/database/seeds/roles.seed.ts
const defaultRoles = [
  { name: 'admin', description: 'Full system access', isDefault: false },
  { name: 'editor', description: 'Can create and edit content', isDefault: false },
  { name: 'viewer', description: 'Read-only access', isDefault: true },
];

const defaultPermissions = [
  { name: 'users:create', resource: 'users', action: 'create' },
  { name: 'users:read', resource: 'users', action: 'read' },
  { name: 'users:update', resource: 'users', action: 'update' },
  { name: 'users:delete', resource: 'users', action: 'delete' },
  { name: 'posts:create', resource: 'posts', action: 'create' },
  { name: 'posts:read', resource: 'posts', action: 'read' },
  { name: 'posts:update', resource: 'posts', action: 'update' },
  { name: 'posts:delete', resource: 'posts', action: 'delete' },
];
```

### Rules

- Use `resource:action` naming for permissions (e.g., `users:create`, `posts:delete`)
- Use junction tables (`role_permissions`, `user_roles`) for many-to-many relationships
- One role should be marked `isDefault: true` — assigned to new users automatically
- Seed default roles and permissions in migrations or seed scripts — not at runtime
- Users can have multiple roles — permissions are the union of all assigned role permissions
- Always `cascade` deletes on junction tables to prevent orphaned records

---

## 9. RBAC Service with Role Hierarchy

Implement role-based authorization with optional hierarchy support.

### RBAC Service

```typescript
// modules/auth/rbac.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DRIZZLE, DrizzleDB } from '@/shared/database/drizzle.provider';
import { userRoles, rolePermissions, roles, permissions } from '@/shared/database/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class RbacService {
  // Role hierarchy: higher roles inherit lower role permissions
  private readonly roleHierarchy: Record<string, string[]> = {
    admin: ['editor', 'viewer'],
    editor: ['viewer'],
    viewer: [],
  };

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user:${userId}:permissions`;
    const cached = await this.cache.get<string[]>(cacheKey);
    if (cached) return cached;

    // Get user's roles
    const userRoleRecords = await this.db.query.userRoles.findMany({
      where: eq(userRoles.userId, userId),
      with: { role: true },
    });

    const roleNames = userRoleRecords.map((ur) => ur.role.name);

    // Expand with hierarchy
    const allRoles = new Set<string>();
    for (const roleName of roleNames) {
      allRoles.add(roleName);
      const inherited = this.roleHierarchy[roleName] ?? [];
      inherited.forEach((r) => allRoles.add(r));
    }

    // Get all permissions for expanded roles
    const roleRecords = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(inArray(roles.name, [...allRoles]));

    const roleIds = roleRecords.map((r) => r.id);
    if (roleIds.length === 0) return [];

    const perms = await this.db
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    const permissionNames = [...new Set(perms.map((p) => p.name))];

    await this.cache.set(cacheKey, permissionNames, 300_000); // 5 min cache
    return permissionNames;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  async hasAnyPermission(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.some((p) => permissions.includes(p));
  }

  async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((p) => permissions.includes(p));
  }

  async invalidateUserCache(userId: string) {
    await this.cache.del(`user:${userId}:permissions`);
  }
}
```

### Assigning Roles

```typescript
@Injectable()
export class RolesService {
  async assignRole(userId: string, roleName: string) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });
    if (!role) throw new NotFoundException(`Role ${roleName} not found`);

    await this.db
      .insert(userRoles)
      .values({ userId, roleId: role.id })
      .onConflictDoNothing();

    await this.rbacService.invalidateUserCache(userId);
  }

  async removeRole(userId: string, roleName: string) {
    const role = await this.db.query.roles.findFirst({
      where: eq(roles.name, roleName),
    });
    if (!role) return;

    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, role.id)));

    await this.rbacService.invalidateUserCache(userId);
  }
}
```

### Rules

- Cache user permissions — don't query the database on every request
- Invalidate permission cache when roles or permissions change
- Use role hierarchy to reduce permission duplication (admin inherits editor inherits viewer)
- Provide `hasAnyPermission` (OR) and `hasAllPermissions` (AND) for flexible checks
- Keep role hierarchy configuration simple — deep hierarchies are hard to reason about
- Use `onConflictDoNothing` when assigning roles to handle idempotent operations

---

## 10. Permissions Decorator Patterns

Create composable decorators that combine auth, roles, and permissions for clean controller code.

### Composed Auth Decorator

```typescript
// common/decorators/auth.decorator.ts
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';

export function Auth(...permissions: string[]) {
  return applyDecorators(
    SetMetadata('permissions', permissions),
    UseGuards(JwtAuthGuard, PermissionsGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Insufficient permissions' }),
  );
}

// Usage — clean, single decorator
@Controller('users')
export class UsersController {
  @Get()
  @Auth(Permissions.Users.Read)
  findAll() {}

  @Post()
  @Auth(Permissions.Users.Create)
  create(@Body() dto: CreateUserDto) {}

  @Delete(':id')
  @Auth(Permissions.Users.Delete)
  remove(@Param('id', ParseUUIDPipe) id: string) {}
}
```

### Admin-Only Decorator

```typescript
export function AdminOnly() {
  return applyDecorators(
    Roles('admin'),
    ApiBearerAuth(),
    ApiForbiddenResponse({ description: 'Admin access required' }),
  );
}

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @AdminOnly()
  getDashboard() {}
}
```

### Resource Owner Decorator

```typescript
// common/decorators/owner-or-permission.decorator.ts
export function OwnerOrPermission(permission: string) {
  return applyDecorators(
    SetMetadata('ownerPermission', permission),
    UseGuards(JwtAuthGuard, OwnerOrPermissionGuard),
    ApiBearerAuth(),
  );
}

// Guard implementation
@Injectable()
export class OwnerOrPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<string>('ownerPermission', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id ?? request.params.userId;

    // Owner check
    if (user.id === resourceId) return true;

    // Permission check
    const permissions: string[] = request.permissions ?? [];
    if (permission && permissions.includes(permission)) return true;

    throw new ForbiddenException();
  }
}

// Usage
@Controller('users')
export class UsersController {
  @Get(':id/profile')
  @OwnerOrPermission(Permissions.Users.Read)
  getProfile(@Param('id', ParseUUIDPipe) id: string) {}
}
```

### Rules

- Use `applyDecorators()` to combine auth, Swagger, and permission decorators into one
- Create domain-specific decorators like `@AdminOnly()`, `@Auth()`, `@OwnerOrPermission()`
- Keep composed decorators in `common/decorators/` for reuse across controllers
- Include Swagger decorators in composed decorators — auth requirements auto-documented
- Prefer composed decorators over stacking 3-4 individual decorators on every route
- Keep guard logic in guards, not in decorators — decorators only set metadata

---

## 11. Fine-Grained Permissions

Implement `resource:action` permission checks for precise access control beyond simple roles.

### Permission Constants

```typescript
// common/constants/permissions.ts
export const Permissions = {
  Users: {
    Create: 'users:create',
    Read: 'users:read',
    Update: 'users:update',
    Delete: 'users:delete',
    ManageRoles: 'users:manage-roles',
  },
  Posts: {
    Create: 'posts:create',
    Read: 'posts:read',
    Update: 'posts:update',
    UpdateAny: 'posts:update-any',
    Delete: 'posts:delete',
    DeleteAny: 'posts:delete-any',
    Publish: 'posts:publish',
  },
  Orders: {
    Create: 'orders:create',
    Read: 'orders:read',
    ReadAny: 'orders:read-any',
    Update: 'orders:update',
    Cancel: 'orders:cancel',
    Refund: 'orders:refund',
  },
} as const;
```

### RequirePermissions Decorator

```typescript
// common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
```

### Controller Usage

```typescript
@Controller('posts')
export class PostsController {
  @Get()
  @RequirePermissions(Permissions.Posts.Read)
  findAll(@Query() query: PostQueryDto) {
    return this.postsService.findAll(query);
  }

  @Post()
  @RequirePermissions(Permissions.Posts.Create)
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.postsService.create(user.id, dto);
  }

  @Post(':id/publish')
  @RequirePermissions(Permissions.Posts.Publish)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.publish(id);
  }

  @Delete(':id')
  @RequirePermissions(Permissions.Posts.Delete, Permissions.Posts.DeleteAny)
  // User needs Delete (own) OR DeleteAny — guard checks any match
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.postsService.remove(id, user);
  }
}
```

### Permission Check in Services

```typescript
@Injectable()
export class OrdersService {
  async findById(orderId: string, currentUser: AuthUser, permissions: string[]) {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) throw new NotFoundException();

    // Can read any order with read-any permission
    if (permissions.includes(Permissions.Orders.ReadAny)) {
      return order;
    }

    // Otherwise, can only read own orders
    if (order.userId !== currentUser.id) {
      throw new ForbiddenException();
    }

    return order;
  }
}
```

### Rules

- Use `resource:action` format for all permissions — consistent and grep-able
- Define permissions as typed constants — avoid magic strings
- Distinguish between "own resource" and "any resource" actions: `posts:update` vs `posts:update-any`
- Guard-level checks handle route access, service-level checks handle data-level access
- Multiple permissions in `@RequirePermissions()` means OR — user needs any one
- Keep permissions flat — don't create nested hierarchies beyond `resource:action`

---

## 12. Resource Ownership Checks

Verify that users can only access or modify resources they own, unless they have elevated permissions.

### Ownership Service

```typescript
// modules/auth/ownership.service.ts
@Injectable()
export class OwnershipService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  // Map of resource type to table and owner column
  private readonly resourceMap = {
    post: { table: posts, ownerColumn: posts.authorId },
    comment: { table: comments, ownerColumn: comments.authorId },
    order: { table: orders, ownerColumn: orders.userId },
  } as const;

  async isOwner(
    resourceType: keyof typeof this.resourceMap,
    resourceId: string,
    userId: string,
  ): Promise<boolean> {
    const config = this.resourceMap[resourceType];
    if (!config) return false;

    const [record] = await this.db
      .select({ ownerId: config.ownerColumn })
      .from(config.table)
      .where(eq((config.table as any).id, resourceId));

    return record?.ownerId === userId;
  }
}
```

### Ownership Guard

```typescript
// common/guards/resource-owner.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export interface ResourceOwnerOptions {
  resourceType: string;
  idParam?: string;            // route param name, default 'id'
  adminBypass?: boolean;       // admins skip ownership check
  bypassPermission?: string;  // specific permission to bypass
}

export const RESOURCE_OWNER_KEY = 'resourceOwner';
export const CheckOwnership = (options: ResourceOwnerOptions) =>
  SetMetadata(RESOURCE_OWNER_KEY, options);

@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ownershipService: OwnershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<ResourceOwnerOptions>(
      RESOURCE_OWNER_KEY,
      context.getHandler(),
    );

    if (!options) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params[options.idParam ?? 'id'];

    // Admin bypass
    if (options.adminBypass && user.role === 'admin') {
      return true;
    }

    // Permission bypass
    if (options.bypassPermission) {
      const permissions: string[] = request.permissions ?? [];
      if (permissions.includes(options.bypassPermission)) return true;
    }

    // Ownership check
    const isOwner = await this.ownershipService.isOwner(
      options.resourceType as any,
      resourceId,
      user.id,
    );

    if (!isOwner) {
      throw new ForbiddenException('You do not own this resource');
    }

    return true;
  }
}
```

### Usage

```typescript
@Controller('posts')
export class PostsController {
  @Patch(':id')
  @CheckOwnership({
    resourceType: 'post',
    adminBypass: true,
    bypassPermission: Permissions.Posts.UpdateAny,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @CheckOwnership({
    resourceType: 'post',
    bypassPermission: Permissions.Posts.DeleteAny,
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.postsService.remove(id);
  }
}
```

### Rules

- Ownership checks happen in guards — before the service layer processes the request
- Always provide bypass options for admins or users with elevated permissions
- Use a centralized `OwnershipService` to avoid duplicating ownership queries
- Map resource types to their tables and owner columns in one place
- Combine with `@RequirePermissions()` for layered authorization: must be authenticated + authorized + owner
- For complex ownership (e.g., team members can edit team posts), use the service layer instead of guards

---

## 13. Token Revocation and Blacklisting

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

---

## 14. Refresh Token Rotation

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

---

## 15. Passport Session Serialization

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

---

## 16. Session Authentication Setup

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

---

## 17. GitHub OAuth2 Integration

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

---

## 18. Google OAuth2 Integration

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

---

## 19. Account Linking

Allow users to connect multiple OAuth providers to a single account.

### Linking Service

```typescript
// modules/auth/account-linking.service.ts
@Injectable()
export class AccountLinkingService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async linkProvider(userId: string, provider: string, providerId: string) {
    // Check if this provider account is already linked to someone
    const existing = await this.db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerId, providerId),
      ),
    });

    if (existing && existing.userId !== userId) {
      throw new ConflictException(
        `This ${provider} account is already linked to another user`,
      );
    }

    if (existing && existing.userId === userId) {
      return; // Already linked
    }

    await this.db.insert(oauthAccounts).values({
      userId,
      provider,
      providerId,
    });
  }

  async unlinkProvider(userId: string, provider: string) {
    // Ensure user has at least one auth method remaining
    const userAccounts = await this.db.query.oauthAccounts.findMany({
      where: eq(oauthAccounts.userId, userId),
    });

    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const hasPassword = !!user?.passwordHash;
    const otherProviders = userAccounts.filter((a) => a.provider !== provider);

    if (!hasPassword && otherProviders.length === 0) {
      throw new BadRequestException(
        'Cannot unlink — set a password or link another provider first',
      );
    }

    await this.db
      .delete(oauthAccounts)
      .where(and(
        eq(oauthAccounts.userId, userId),
        eq(oauthAccounts.provider, provider),
      ));
  }

  async getLinkedProviders(userId: string) {
    const accounts = await this.db.query.oauthAccounts.findMany({
      where: eq(oauthAccounts.userId, userId),
      columns: { provider: true, createdAt: true },
    });

    return accounts;
  }
}
```

### Controller

```typescript
@Controller('auth/providers')
export class ProvidersController {
  @Get()
  getLinkedProviders(@CurrentUser('id') userId: string) {
    return this.linkingService.getLinkedProviders(userId);
  }

  // Initiate linking flow (user must be authenticated)
  @Get('google/link')
  @UseGuards(AuthGuard('google'))
  linkGoogle() {}

  @Get('google/link/callback')
  @UseGuards(AuthGuard('google'))
  async googleLinkCallback(@CurrentUser('id') userId: string, @Req() req: Request) {
    await this.linkingService.linkProvider(userId, 'google', req.user.providerId);
    return { message: 'Google account linked' };
  }

  @Delete(':provider')
  unlinkProvider(
    @CurrentUser('id') userId: string,
    @Param('provider') provider: string,
  ) {
    return this.linkingService.unlinkProvider(userId, provider);
  }
}
```

### Rules

- Prevent linking a provider account that's already linked to a different user
- Prevent unlinking the last auth method — user must have a password or another provider
- Linking requires an authenticated session — user initiates it from their settings
- Keep the OAuth accounts table separate from users — clean separation of concerns
- Return linked providers in the user profile API for the frontend settings UI
- Handle the edge case where a user tries to link the same provider twice (idempotent)

---

## 20. Tenant Identification

Identify the current tenant from subdomain, header, or JWT claim in multi-tenant applications.

### Tenant Middleware

```typescript
// common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.resolveTenant(req);

    if (!tenantId) {
      throw new BadRequestException('Tenant identification required');
    }

    // Attach to request for downstream use
    (req as any).tenantId = tenantId;
    next();
  }

  private resolveTenant(req: Request): string | null {
    // Strategy 1: Custom header
    const headerTenant = req.headers['x-tenant-id'] as string;
    if (headerTenant) return headerTenant;

    // Strategy 2: Subdomain
    const host = req.hostname;
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }

    // Strategy 3: JWT claim (if authenticated)
    const user = (req as any).user;
    if (user?.tenantId) return user.tenantId;

    return null;
  }
}
```

### Tenant Decorator

```typescript
// common/decorators/tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

### Tenant Guard

```typescript
// common/guards/tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new BadRequestException('Tenant not identified');
    }

    // Verify tenant exists and is active
    const tenant = await this.db.query.tenants.findFirst({
      where: and(eq(tenants.id, tenantId), eq(tenants.isActive, true)),
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found or inactive');
    }

    request.tenant = tenant;
    return true;
  }
}
```

### Usage

```typescript
@Controller('projects')
export class ProjectsController {
  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.projectsService.findByTenant(tenantId);
  }

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(tenantId, user.id, dto);
  }
}
```

### Rules

- Resolve tenant as early as possible — middleware runs before guards and interceptors
- Support multiple identification strategies (header, subdomain, JWT) with fallback chain
- Validate that the tenant exists and is active before processing the request
- Attach `tenantId` to the request object for use throughout the request lifecycle
- Create a `@CurrentTenant()` decorator for clean access in controllers
- Fail loudly if tenant can't be identified — never default to a tenant silently

---

## 21. Tenant Data Isolation

Ensure tenants can only access their own data using row-level filtering or schema-level separation.

### Row-Level Security (Application Layer)

```typescript
// shared/database/base-tenant.repository.ts
@Injectable()
export abstract class BaseTenantRepository<TTable extends PgTable> {
  constructor(
    @Inject(DRIZZLE) protected readonly db: DrizzleDB,
    @Inject(REQUEST) protected readonly request: Request,
    protected readonly table: TTable,
  ) {}

  private get tenantId(): string {
    return (this.request as any).tenantId;
  }

  async findAll(where?: SQL): Promise<any[]> {
    const tenantCondition = eq((this.table as any).tenantId, this.tenantId);
    const fullWhere = where ? and(tenantCondition, where) : tenantCondition;

    return this.db.select().from(this.table).where(fullWhere);
  }

  async findById(id: string): Promise<any | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(and(
        eq((this.table as any).id, id),
        eq((this.table as any).tenantId, this.tenantId),
      ));
    return record ?? null;
  }

  async create(data: any): Promise<any> {
    const [record] = await this.db
      .insert(this.table)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return record;
  }

  async update(id: string, data: any): Promise<any | null> {
    const [record] = await this.db
      .update(this.table)
      .set(data)
      .where(and(
        eq((this.table as any).id, id),
        eq((this.table as any).tenantId, this.tenantId),
      ))
      .returning();
    return record ?? null;
  }

  async delete(id: string): Promise<void> {
    await this.db
      .delete(this.table)
      .where(and(
        eq((this.table as any).id, id),
        eq((this.table as any).tenantId, this.tenantId),
      ));
  }
}
```

### Tenant-Scoped Repository Usage

```typescript
@Injectable({ scope: Scope.REQUEST })
export class ProjectsRepository extends BaseTenantRepository<typeof projects> {
  constructor(
    @Inject(DRIZZLE) db: DrizzleDB,
    @Inject(REQUEST) request: Request,
  ) {
    super(db, request, projects);
  }

  async findByStatus(status: string) {
    return this.findAll(eq(projects.status, status));
    // Automatically scoped to current tenant
  }
}
```

### PostgreSQL Row-Level Security (Database Layer)

```sql
-- Migration: enable RLS on tenant tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON projects
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Force RLS even for table owners
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
```

```typescript
// Set tenant context before each query
@Injectable()
export class TenantDatabaseInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    if (tenantId) {
      await this.db.execute(
        sql`SET LOCAL app.current_tenant_id = ${tenantId}`,
      );
    }

    return next.handle();
  }
}
```

### Rules

- Application-layer filtering: every query must include `WHERE tenant_id = ?` — use a base repository
- Database-layer RLS: PostgreSQL enforces isolation regardless of application bugs (defense in depth)
- Use `Scope.REQUEST` for tenant repositories — they need the current request's tenant ID
- Always inject `tenantId` automatically — never rely on developers remembering to filter
- Test isolation: verify that Tenant A cannot access Tenant B's data
- Add `tenantId` column with an index on every tenant-scoped table

---

## 22. Brute Force Protection

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

---

## 23. CSRF and CORS Configuration

Configure CORS and CSRF protection for secure cross-origin communication.

### CORS Configuration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.get<string[]>('app.corsOrigins'),
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Tenant-Id'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    credentials: true,       // required for cookies
    maxAge: 86400,           // preflight cache: 24 hours
  });

  await app.listen(3000);
}
```

### CSRF Protection (for Cookie-Based Auth)

```typescript
// modules/auth/csrf.service.ts
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class CsrfService {
  constructor(private readonly config: ConfigService) {}

  generateToken(sessionId: string): string {
    const secret = this.config.get('csrf.secret');
    const salt = randomBytes(16).toString('hex');
    const hmac = createHmac('sha256', secret)
      .update(`${sessionId}:${salt}`)
      .digest('hex');
    return `${salt}:${hmac}`;
  }

  validateToken(token: string, sessionId: string): boolean {
    const secret = this.config.get('csrf.secret');
    const [salt, hmac] = token.split(':');
    if (!salt || !hmac) return false;

    const expected = createHmac('sha256', secret)
      .update(`${sessionId}:${salt}`)
      .digest('hex');
    return hmac === expected;
  }
}

// CSRF Guard
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly csrfService: CsrfService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true;

    // Skip for Bearer token auth (not vulnerable to CSRF)
    if (request.headers.authorization?.startsWith('Bearer ')) return true;

    const token = request.headers['x-csrf-token'];
    const sessionId = request.session?.id;

    if (!token || !sessionId) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (!this.csrfService.validateToken(token, sessionId)) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
```

### Security Headers

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // may break some third-party integrations
}));
```

### CSRF Token Endpoint

```typescript
@Controller('auth')
export class AuthController {
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request) {
    const token = this.csrfService.generateToken(req.session.id);
    return { csrfToken: token };
  }
}
```

### Rules

- CORS: whitelist specific origins — never use `origin: '*'` with `credentials: true`
- CORS: set `credentials: true` only when using cookie-based auth
- CSRF protection is needed for cookie-based auth — not for Bearer token auth (tokens aren't auto-sent)
- Use `helmet` middleware for security headers (CSP, X-Frame-Options, HSTS)
- Include `X-CSRF-Token` in `allowedHeaders` when using CSRF protection
- Skip CSRF validation for GET/HEAD/OPTIONS — they should be safe (no side effects)

---

## 24. Password Hashing and Validation

Securely hash and validate passwords using argon2.

### Password Utility

```typescript
// common/utils/password.util.ts
import { hash, verify, Options } from 'argon2';

const ARGON2_OPTIONS: Options & { raw?: false } = {
  type: 2,          // argon2id (recommended)
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
};

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}
```

### Password Validation DTO

```typescript
// common/dto/password.dto.ts
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class PasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
  newPassword: string;
}
```

### Password Change Service

```typescript
@Injectable()
export class AuthService {
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findById(userId);
    if (!user) throw new NotFoundException();

    const isValid = await verifyPassword(user.passwordHash, dto.currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Prevent reuse of current password
    const isSame = await verifyPassword(user.passwordHash, dto.newPassword);
    if (isSame) {
      throw new BadRequestException('New password must be different from current');
    }

    const newHash = await hashPassword(dto.newPassword);
    await this.usersRepo.update(userId, { passwordHash: newHash });

    // Revoke all sessions/refresh tokens after password change
    await this.refreshTokenService.revokeAllForUser(userId);

    return { message: 'Password changed successfully' };
  }
}
```

### Rules

- Use `argon2id` (type 2) — resistant to both GPU and side-channel attacks
- Set memory cost to at least 64MB and time cost to at least 3 iterations
- Never store passwords in plain text, MD5, SHA-256, or unsalted hashes
- Cap password length at 128 characters — argon2 is intentionally slow on long inputs
- Revoke all sessions after password change — prevents stolen tokens from remaining valid
- Return generic "Invalid credentials" on login failure — don't reveal whether email or password was wrong

---

## 25. E2E Testing Protected Endpoints

Test authenticated endpoints with real JWT tokens in E2E tests.

### Auth Test Helper

```typescript
// test/helpers/auth.helper.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function getAuthToken(
  app: INestApplication,
  email: string = 'admin@test.com',
  password: string = 'TestPass123!',
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return response.body.data.accessToken;
}

export async function registerAndLogin(
  app: INestApplication,
  user: { email: string; name: string; password: string },
): Promise<{ token: string; userId: string }> {
  const registerRes = await request(app.getHttpServer())
    .post('/auth/register')
    .send(user)
    .expect(201);

  return {
    token: registerRes.body.data.accessToken,
    userId: registerRes.body.data.user.id,
  };
}

// Helper for making authenticated requests
export function authRequest(app: INestApplication, token: string) {
  const server = app.getHttpServer();
  return {
    get: (url: string) => request(server).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(server).post(url).set('Authorization', `Bearer ${token}`),
    patch: (url: string) => request(server).patch(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(server).delete(url).set('Authorization', `Bearer ${token}`),
  };
}
```

### E2E Test with Authentication

```typescript
// test/users/users.e2e-spec.ts
describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase();
    await seedTestUsers();

    adminToken = await getAuthToken(app, 'admin@test.com', 'TestPass123!');
    const member = await registerAndLogin(app, {
      email: 'member@test.com',
      name: 'Member',
      password: 'TestPass123!',
    });
    memberToken = member.token;
    memberId = member.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return users for admin', () => {
      return authRequest(app, adminToken)
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should return 403 for member', () => {
      return authRequest(app, memberToken)
        .get('/users')
        .expect(403);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should allow user to update own profile', () => {
      return authRequest(app, memberToken)
        .patch(`/users/${memberId}`)
        .send({ name: 'Updated Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.name).toBe('Updated Name');
        });
    });

    it('should prevent member from updating other users', () => {
      return authRequest(app, memberToken)
        .patch('/users/other-user-id')
        .send({ name: 'Hacked' })
        .expect(403);
    });

    it('should allow admin to update any user', () => {
      return authRequest(app, adminToken)
        .patch(`/users/${memberId}`)
        .send({ name: 'Admin Updated' })
        .expect(200);
    });
  });
});
```

### Testing Auth Flows

```typescript
describe('Auth (e2e)', () => {
  it('should register, login, and access protected route', async () => {
    // Register
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'new@test.com', name: 'New', password: 'TestPass123!' })
      .expect(201);

    const { accessToken } = registerRes.body.data;

    // Access protected route
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.email).toBe('new@test.com');
      });
  });

  it('should return 401 for invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' })
      .expect(401);
  });

  it('should refresh tokens', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'TestPass123!' })
      .expect(200);

    const { refreshToken } = loginRes.body.data;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.refreshToken).toBeDefined();
      });
  });
});
```

### Rules

- Use real token generation in E2E tests — don't mock auth at this level
- Create helper functions for common auth operations (login, register, authenticated requests)
- Test all permission levels: unauthenticated (401), unauthorized (403), and authorized (200)
- Test resource ownership: user can access own resources, can't access others'
- Test complete auth flows: register → login → access → refresh → logout
- Seed test users with known credentials in `beforeAll` — don't rely on pre-existing data

---

## 26. Mocking Auth in Unit Tests

Override auth guards and inject mock users for isolated unit testing.

### Override Global Guard

```typescript
// modules/users/users.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should return users', async () => {
    const mockUsers = [{ id: '1', name: 'Alice', email: 'alice@test.com' }];
    service.findAll.mockResolvedValue({ data: mockUsers, meta: { total: 1 } });

    const result = await controller.findAll({});
    expect(result.data).toEqual(mockUsers);
  });
});
```

### Mock User Factory

```typescript
// test/factories/auth.factory.ts
import { AuthUser } from '@/common/decorators/current-user.decorator';

export function buildAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'member',
    ...overrides,
  };
}

export const mockAdmin = buildAuthUser({ id: 'admin-1', role: 'admin' });
export const mockMember = buildAuthUser({ id: 'member-1', role: 'member' });
```

### Testing Service Authorization

```typescript
describe('PostsService', () => {
  it('should allow admin to delete any post', async () => {
    const post = { id: 'post-1', authorId: 'other-user', title: 'Test' };
    postsRepo.findById.mockResolvedValue(post);
    postsRepo.delete.mockResolvedValue(post);

    const result = await service.remove('post-1', mockAdmin);
    expect(postsRepo.delete).toHaveBeenCalledWith('post-1');
  });

  it('should prevent member from deleting others post', async () => {
    const post = { id: 'post-1', authorId: 'other-user', title: 'Test' };
    postsRepo.findById.mockResolvedValue(post);

    await expect(service.remove('post-1', mockMember)).rejects.toThrow(ForbiddenException);
  });
});
```

### Testing Guards Directly

```typescript
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockExecutionContext({ user: { role: 'member' } });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockExecutionContext({ user: { role: 'member' } });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

### Rules

- Use `.overrideGuard()` to bypass auth in controller unit tests — focus on business logic
- Test authorization logic in services independently with mock users
- Test guards in isolation with mock execution contexts
- Create user factories for consistent test data: `mockAdmin`, `mockMember`
- Don't mock auth in E2E tests — use real token generation instead
- Test both positive (allowed) and negative (forbidden) authorization paths

---
