---
title: DTO Transformation and Serialization
tags: dtos, transformation, class-transformer, serialization
---

## DTO Transformation and Serialization

class-transformer converts plain objects to class instances (request) and class instances to plain objects (response). Use it with interceptors for consistent serialization.

### Serialization Interceptor

```typescript
// common/interceptors/transform.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has envelope structure, pass through
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        return { data };
      }),
    );
  }
}
```

### Query DTO with Transformation

```typescript
// dto/user-query.dto.ts
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @IsOptional()
  @Type(() => Number)   // Transform string query param to number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  get offset(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}
```

### Date Transformation

```typescript
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
```

Rules:
- Enable `transform: true` and `enableImplicitConversion: true` in global ValidationPipe
- Use `@Type(() => Number)` for query params that arrive as strings
- Use `@Type(() => Date)` for date strings
- Keep transformation logic in DTOs, not in controllers or services
