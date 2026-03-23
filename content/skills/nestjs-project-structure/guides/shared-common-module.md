---
title: Common Module for Cross-Cutting Concerns
tags: shared, common, guards, interceptors, filters, pipes
---

## Common Module for Cross-Cutting Concerns

The `common/` directory holds cross-cutting decorators, guards, interceptors, pipes, and filters that are used globally or across multiple modules.

### Structure

```text
common/
  decorators/
    current-user.decorator.ts    # Extract user from request
    roles.decorator.ts           # @Roles('admin', 'user')
    public.decorator.ts          # @Public() to skip auth
    api-paginated.decorator.ts   # Swagger pagination docs
  filters/
    all-exceptions.filter.ts     # Global exception handler
    validation.filter.ts         # Transform validation errors
  guards/
    jwt-auth.guard.ts            # JWT authentication
    roles.guard.ts               # Role-based authorization
  interceptors/
    logging.interceptor.ts       # Request/response logging
    transform.interceptor.ts     # Response envelope wrapping
    timeout.interceptor.ts       # Request timeout
  pipes/
    parse-uuid.pipe.ts           # UUID validation
    trim-strings.pipe.ts         # Trim whitespace from strings
  constants/
    injection-tokens.ts          # DI token constants
```

### Global Registration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  await app.listen(3000);
}
```

### Custom Decorator Example

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage: @CurrentUser() user: User
// Usage: @CurrentUser('id') userId: string
```

Rules:
- `common/` is NOT a NestJS module — just a directory for shared providers
- Register global providers in `main.ts` or via `APP_GUARD`/`APP_INTERCEPTOR` tokens
- Keep each file focused on one concern
- Decorators, pipes, and filters here should be truly generic — domain-specific ones stay in their module
