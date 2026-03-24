---
title: OpenAPI Schema Definitions
tags: openapi, schemas, models, documentation
---

## OpenAPI Schema Definitions

Define reusable response schemas for accurate API documentation.

### Response Models

```typescript
// common/dto/api-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 8 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;
}

export class ErrorResponse {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'User not found' })
  message: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/users/123' })
  path: string;
}
```

### Generic Paginated Response

```typescript
// common/dto/paginated-response.dto.ts
import { Type, applyDecorators } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';

// Helper to create paginated response decorator
export function ApiPaginatedResponse<T extends Type>(model: T) {
  return applyDecorators(
    ApiExtraModels(model, PaginationMeta),
    ApiOkResponse({
      schema: {
        properties: {
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: { $ref: getSchemaPath(PaginationMeta) },
        },
      },
    }),
  );
}

// Usage
@Get()
@ApiPaginatedResponse(UserResponseDto)
findAll(@Query() query: UserQueryDto) {
  return this.usersService.findAll(query);
}
```

### Enum Documentation

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export class OrderResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: '99.99', description: 'Order total in USD' })
  total: string;

  @ApiProperty({ type: [OrderItemResponseDto], description: 'Line items' })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;
}
```

### File Upload Documentation

```typescript
@Post('avatar')
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
uploadAvatar(@UploadedFile() file: Express.Multer.File) {}
```

### Rules

- Create reusable response DTOs for pagination, errors, and common patterns
- Use `@ApiExtraModels` to register models referenced via `$ref`
- Create custom decorators like `@ApiPaginatedResponse` for DRY documentation
- Document all enums with `enum` property — Swagger UI renders them as dropdowns
- Use `@ApiConsumes('multipart/form-data')` for file upload endpoints
- Keep response DTOs in sync with actual responses — outdated docs are worse than no docs
