---
title: Validation Pipe Configuration
tags: errors, validation, pipe, class-validator
---

## Validation Pipe Configuration

Configure the global validation pipe for automatic request validation and transformation.

### Global Setup

```typescript
// main.ts
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // strip properties without decorators
    forbidNonWhitelisted: true,   // throw 400 if unknown properties sent
    transform: true,              // auto-transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true, // convert query string types
    },
    stopAtFirstError: false,      // return all validation errors
    errorHttpStatusCode: 422,     // optional: use 422 instead of 400
  }),
);
```

### Custom Error Formatting

```typescript
new ValidationPipe({
  whitelist: true,
  transform: true,
  exceptionFactory: (errors) => {
    const details: Record<string, string[]> = {};

    for (const error of errors) {
      const field = error.property;
      const messages = Object.values(error.constraints ?? {});
      details[field] = messages;

      // Handle nested validation errors
      if (error.children?.length) {
        for (const child of error.children) {
          const nestedField = `${field}.${child.property}`;
          details[nestedField] = Object.values(child.constraints ?? {});
        }
      }
    }

    return new UnprocessableEntityException({
      message: 'Validation failed',
      details,
    });
  },
});
```

### Pipe-Level Validation

```typescript
// Apply validation to specific params
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.usersService.findById(id);
}

// Custom parse pipe with error message
@Get(':id')
findOne(
  @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) id: string,
) {}

// Parse and validate enums
@Get()
findByStatus(@Query('status', new ParseEnumPipe(OrderStatus)) status: OrderStatus) {}
```

### Rules

- Set `whitelist: true` globally — prevents mass-assignment attacks
- Set `forbidNonWhitelisted: true` to alert clients about unsupported fields
- Use `transform: true` so DTOs are actual class instances (required for `@Type` decorators)
- Use `enableImplicitConversion` for query parameters — they arrive as strings from HTTP
- Customize `exceptionFactory` for field-level error details in API responses
- Use built-in parse pipes (`ParseUUIDPipe`, `ParseIntPipe`) for path/query parameters
