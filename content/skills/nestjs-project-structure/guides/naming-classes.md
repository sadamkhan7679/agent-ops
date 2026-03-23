---
title: Class and Decorator Naming
tags: naming, classes, decorators, conventions
---

## Class and Decorator Naming

Class names follow PascalCase with the same suffix convention as file names.

### Standard Patterns

```typescript
// Module
export class UsersModule {}

// Controller
@Controller('users')
export class UsersController {}

// Service
@Injectable()
export class UsersService {}

// Repository
@Injectable()
export class UsersRepository {}

// Guard
@Injectable()
export class JwtAuthGuard implements CanActivate {}

// Interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {}

// Pipe
@Injectable()
export class ParseUUIDPipe implements PipeTransform {}

// Filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {}

// DTO
export class CreateUserDto {}
export class UpdateUserDto {}
export class UserResponseDto {}
export class UserQueryDto {}

// Entity
export class UserEntity {}

// Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {}

// Provider token
export const DRIZZLE = Symbol('DRIZZLE');

// Custom decorator (function, not class)
export const CurrentUser = createParamDecorator(...);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const Public = () => SetMetadata('isPublic', true);
```

### Rules

- Class name = PascalCase version of file name
- `UsersService` in `users.service.ts`
- `JwtAuthGuard` in `jwt-auth.guard.ts`
- DTOs include the operation: `Create`, `Update`, `Query`, `Response`
- Custom decorators are functions, not classes — use camelCase
- Injection tokens use UPPER_SNAKE_CASE Symbols
