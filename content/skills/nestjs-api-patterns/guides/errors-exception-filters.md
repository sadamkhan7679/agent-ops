---
title: Exception Filters
tags: errors, exception-filter, error-handling, http
---

## Exception Filters

Centralize error handling with exception filters for consistent error responses.

### Global Exception Filter

```typescript
// common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string'
        ? exResponse
        : (exResponse as any).message ?? exception.message;
      details = typeof exResponse === 'object' ? (exResponse as any).details : undefined;
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    }

    // Don't expose internal details in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR && process.env.NODE_ENV === 'production') {
      message = 'Internal server error';
      details = undefined;
    }

    response.status(status).json({
      error: {
        statusCode: status,
        message,
        ...(details && { details }),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### Validation Exception Filter

```typescript
// common/filters/validation-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const exResponse = exception.getResponse() as any;

    // Format class-validator errors into field-level details
    const details: Record<string, string[]> = {};
    if (Array.isArray(exResponse.message)) {
      for (const msg of exResponse.message) {
        // "name must be a string" → field: "name", message: "must be a string"
        const [field, ...rest] = msg.split(' ');
        if (!details[field]) details[field] = [];
        details[field].push(rest.join(' '));
      }
    }

    response.status(400).json({
      error: {
        statusCode: 400,
        message: 'Validation failed',
        details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

### Registration

```typescript
// main.ts
app.useGlobalFilters(
  new AllExceptionsFilter(),      // catch-all (lowest priority)
  new ValidationExceptionFilter(), // specific (highest priority)
);
```

### Rules

- Register the catch-all filter first, specific filters after — NestJS checks most-specific first
- Log unhandled exceptions with full stack traces — critical for debugging
- Never expose stack traces or internal messages in production responses
- Format validation errors into field-level details for better client UX
- Keep the error response shape consistent: `{ error: { statusCode, message, details?, timestamp, path } }`
- Use `@Catch()` with no arguments for the catch-all filter, `@Catch(SpecificException)` for targeted ones
