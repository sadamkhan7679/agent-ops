---
title: Response Envelope Pattern
tags: rest, response, envelope, interceptor
---

## Response Envelope Pattern

Wrap all API responses in a consistent envelope for predictable client consumption.

### Response Shape

```typescript
// common/interfaces/api-response.interface.ts
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  error: {
    statusCode: number;
    message: string;
    details?: Record<string, string[]>;
    timestamp: string;
    path: string;
  };
}
```

### Transform Interceptor

```typescript
// common/interceptors/transform.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If the controller already returned an envelope, pass through
        if (data && typeof data === 'object' && 'data' in data && 'meta' in data) {
          return data;
        }

        return { data };
      }),
    );
  }
}
```

### Register Globally

```typescript
// main.ts
app.useGlobalInterceptors(new TransformInterceptor());
```

### Controller Usage

```typescript
@Controller('users')
export class UsersController {
  // Simple response → { data: { id, name, email } }
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  // Paginated response → { data: [...], meta: { total, page, limit, totalPages } }
  @Get()
  async findAll(@Query() query: UserQueryDto) {
    const { data, meta } = await this.usersService.findAll(query);
    return { data, meta }; // already enveloped, interceptor passes through
  }
}
```

### Error Response (Exception Filter)

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error = {
      statusCode: status,
      message: typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message,
      details: typeof exceptionResponse === 'object' ? (exceptionResponse as any).details : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json({ error });
  }
}
```

### Rules

- All success responses: `{ data: T }` or `{ data: T[], meta: {...} }`
- All error responses: `{ error: { statusCode, message, timestamp, path } }`
- Use an interceptor for success wrapping — controllers return plain data
- Use an exception filter for error formatting — consistent across all exceptions
- Controllers can return pre-enveloped responses for paginated results
- Never mix envelope shapes — clients should always check `data` or `error`
