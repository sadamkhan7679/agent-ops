# Nestjs Api Patterns — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

REST and GraphQL API design patterns for NestJS covering DTOs, versioning, pagination, filtering, sorting, caching, rate limiting, file uploads, and OpenAPI documentation. Use when building NestJS APIs, designing endpoints, implementing query patterns, or optimizing API performance.

## Table of Contents

1. [REST Endpoint Design: Bulk Operations](#1-bulk-operations)
2. [REST Endpoint Design: RESTful Resource Naming](#2-restful-resource-naming)
3. [REST Endpoint Design: Response Envelope Pattern](#3-response-envelope-pattern)
4. [Pagination & Filtering: Cursor-Based Pagination](#4-cursor-based-pagination)
5. [Pagination & Filtering: Filtering and Search](#5-filtering-and-search)
6. [Pagination & Filtering: Offset-Based Pagination](#6-offset-based-pagination)
7. [Pagination & Filtering: Dynamic Sorting](#7-dynamic-sorting)
8. [DTOs & Validation: Nested DTO Validation](#8-nested-dto-validation)
9. [DTOs & Validation: Partial Update DTOs](#9-partial-update-dtos)
10. [DTOs & Validation: Request and Response DTOs](#10-request-and-response-dtos)
11. [Error Handling: Business Exception Hierarchy](#11-business-exception-hierarchy)
12. [Error Handling: Exception Filters](#12-exception-filters)
13. [Error Handling: Validation Pipe Configuration](#13-validation-pipe-configuration)
14. [Caching: Response Caching Interceptor](#14-response-caching-interceptor)
15. [Caching: Cache Invalidation Strategies](#15-cache-invalidation-strategies)
16. [Caching: Redis Caching](#16-redis-caching)
17. [API Versioning: Header-Based Versioning](#17-header-based-versioning)
18. [API Versioning: URI Versioning](#18-uri-versioning)
19. [Rate Limiting: Custom Rate Limiting](#19-custom-rate-limiting)
20. [Rate Limiting: Rate Limiting with Throttler](#20-rate-limiting-with-throttler)
21. [File Uploads: File Uploads with Multer](#21-file-uploads-with-multer)
22. [File Uploads: Streaming Uploads and Downloads](#22-streaming-uploads-and-downloads)
23. [GraphQL Patterns: DataLoader for N+1 Prevention](#23-dataloader-for-n-1-prevention)
24. [GraphQL Patterns: GraphQL Resolvers](#24-graphql-resolvers)
25. [GraphQL Patterns: GraphQL Subscriptions](#25-graphql-subscriptions)
26. [OpenAPI Documentation: OpenAPI/Swagger Decorators](#26-openapi-swagger-decorators)
27. [OpenAPI Documentation: OpenAPI Schema Definitions](#27-openapi-schema-definitions)

---

## 1. Bulk Operations

Handle bulk create, update, and delete operations efficiently.

### Bulk Create

```typescript
// modules/products/products.controller.ts
@Controller('products')
export class ProductsController {
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() dto: BulkCreateProductsDto) {
    return this.productsService.bulkCreate(dto.items);
  }
}

// dto/bulk-create-products.dto.ts
export class BulkCreateProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(100) // prevent oversized batches
  @Type(() => CreateProductDto)
  items: CreateProductDto[];
}
```

### Bulk Service Implementation

```typescript
// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  async bulkCreate(items: CreateProductDto[]) {
    return this.db.transaction(async (tx) => {
      const created = await tx
        .insert(products)
        .values(items.map((item) => ({
          name: item.name,
          price: item.price,
          categoryId: item.categoryId,
        })))
        .returning();

      return { data: created, count: created.length };
    });
  }

  async bulkUpdate(updates: BulkUpdateItem[]) {
    return this.db.transaction(async (tx) => {
      const results = await Promise.all(
        updates.map(({ id, ...data }) =>
          tx.update(products).set(data).where(eq(products.id, id)).returning(),
        ),
      );

      return { data: results.flat(), count: results.length };
    });
  }

  async bulkDelete(ids: string[]) {
    const deleted = await this.db
      .delete(products)
      .where(inArray(products.id, ids))
      .returning({ id: products.id });

    return { deletedCount: deleted.length };
  }
}
```

### Bulk Delete Endpoint

```typescript
@Controller('products')
export class ProductsController {
  // DELETE with body for bulk operations
  @Delete('bulk')
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.productsService.bulkDelete(dto.ids);
  }
}

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(100)
  ids: string[];
}
```

### Rules

- Use `POST /resource/bulk` for bulk create — not `POST /resource` with an array body
- Wrap bulk mutations in a transaction — all succeed or all fail
- Set `@ArrayMaxSize()` on DTOs to prevent oversized payloads
- Use `@ValidateNested({ each: true })` with `@Type()` for array item validation
- Return the count of affected records alongside the data
- For very large batches (1000+), consider async processing with a job queue instead

---

## 2. RESTful Resource Naming

Consistent resource naming makes APIs predictable and self-documenting.

### Standard CRUD Routes

```typescript
// modules/users/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
```

### Nested Resources

```typescript
// modules/posts/comments.controller.ts
@Controller('posts/:postId/comments')
export class CommentsController {
  @Get()
  findAll(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Post()
  create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, dto);
  }
}

// Only nest one level deep. For deeper access, use top-level:
// GET /comments/:commentId       ← direct access
// GET /posts/:postId/comments    ← scoped listing
```

### Action Endpoints

```typescript
// Non-CRUD actions use verbs as sub-resources
@Controller('orders')
export class OrdersController {
  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id);
  }

  @Post(':id/ship')
  ship(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ShipOrderDto) {
    return this.ordersService.ship(id, dto);
  }

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportDto) {
    return this.ordersService.bulkImport(dto);
  }
}
```

### Rules

- Use plural nouns for resource names: `/users`, `/posts`, `/orders`
- Use kebab-case for multi-word resources: `/order-items`, `/payment-methods`
- Nest routes maximum one level deep: `/posts/:postId/comments`
- Use `PATCH` for partial updates, `PUT` for full replacement (prefer `PATCH`)
- Use `POST` for actions that don't map to CRUD: `/orders/:id/cancel`
- Always validate path params with `ParseUUIDPipe` or `ParseIntPipe`
- Return `204 No Content` for successful deletes

---

## 3. Response Envelope Pattern

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

---

## 4. Cursor-Based Pagination

Cursor pagination provides consistent performance regardless of page depth and handles real-time data correctly.

### Cursor Pagination DTO

```typescript
// common/dto/cursor-pagination.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Response Shape

```typescript
// common/interfaces/cursor-paginated.interface.ts
export interface CursorPaginatedResponse<T> {
  data: T[];
  meta: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
  };
}
```

### Repository Implementation

```typescript
// modules/posts/posts.repository.ts
async findWithCursor(params: {
  cursor?: string;
  limit: number;
  authorId?: string;
}): Promise<CursorPaginatedResponse<Post>> {
  const { cursor, limit, authorId } = params;
  const conditions: SQL[] = [];

  if (authorId) {
    conditions.push(eq(posts.authorId, authorId));
  }

  // Decode cursor: "createdAt_id" for deterministic ordering
  if (cursor) {
    const [cursorDate, cursorId] = Buffer.from(cursor, 'base64url')
      .toString()
      .split('|');

    conditions.push(
      or(
        lt(posts.createdAt, new Date(cursorDate)),
        and(
          eq(posts.createdAt, new Date(cursorDate)),
          lt(posts.id, cursorId),
        ),
      )!,
    );
  }

  const items = await this.db
    .select()
    .from(posts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(posts.createdAt), desc(posts.id))
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, -1) : items;

  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem
    ? Buffer.from(`${lastItem.createdAt.toISOString()}|${lastItem.id}`).toString('base64url')
    : null;

  return { data, meta: { hasMore, nextCursor, limit } };
}
```

### Controller

```typescript
@Controller('posts')
export class PostsController {
  @Get()
  findAll(@Query() query: CursorPaginationDto) {
    return this.postsService.findAll(query);
  }
}
```

### Rules

- Encode cursors as opaque base64url strings — clients should not parse them
- Use composite cursor (timestamp + id) for deterministic ordering with duplicates
- Fetch `limit + 1` to detect `hasMore` without a separate count query
- Cursor pagination does not support "jump to page N" — use offset pagination if that's required
- Ideal for feeds, infinite scroll, and real-time data where rows are inserted frequently
- Always order by the same columns used in the cursor condition

---

## 5. Filtering and Search

Build flexible, type-safe query filters using DTOs and dynamic condition builders.

### Filter DTO

```typescript
// modules/products/dto/product-query.dto.ts
import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@/common/dto/pagination.dto';

export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsEnum(['price_asc', 'price_desc', 'newest', 'name_asc'])
  sort?: string = 'newest';
}
```

### Dynamic Condition Builder

```typescript
// modules/products/products.repository.ts
import { and, eq, gte, lte, ilike, or, desc, asc, SQL } from 'drizzle-orm';

async findFiltered(query: ProductQueryDto) {
  const conditions: SQL[] = [isNull(products.deletedAt)];

  if (query.search) {
    conditions.push(
      or(
        ilike(products.name, `%${query.search}%`),
        ilike(products.description, `%${query.search}%`),
      )!,
    );
  }

  if (query.categoryId) {
    conditions.push(eq(products.categoryId, query.categoryId));
  }

  if (query.minPrice !== undefined) {
    conditions.push(gte(products.price, query.minPrice.toString()));
  }

  if (query.maxPrice !== undefined) {
    conditions.push(lte(products.price, query.maxPrice.toString()));
  }

  const where = and(...conditions);

  // Dynamic sort
  const orderBy = {
    price_asc: [asc(products.price)],
    price_desc: [desc(products.price)],
    newest: [desc(products.createdAt)],
    name_asc: [asc(products.name)],
  }[query.sort ?? 'newest'];

  const { page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const [data, [{ total }]] = await Promise.all([
    this.db
      .select()
      .from(products)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    this.db.select({ total: count() }).from(products).where(where),
  ]);

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
```

### Multi-Value Filters

```typescript
// GET /products?status=active,featured&tags=sale,new
export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// In repository
if (query.status?.length) {
  conditions.push(inArray(products.status, query.status));
}
```

### Rules

- Extend `PaginationDto` for domain-specific query DTOs — keeps pagination consistent
- Use `@Type(() => Number)` for numeric query params — they arrive as strings
- Use `@Transform` for comma-separated multi-value filters
- Build conditions array dynamically — only add conditions for provided filters
- Validate sort options with `@IsEnum` — prevent SQL injection through sort params
- Use `ilike` for case-insensitive text search with PostgreSQL

---

## 6. Offset-Based Pagination

Offset pagination is simple to implement and supports jumping to arbitrary pages.

### Pagination DTO

```typescript
// common/dto/pagination.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### Response Interface

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Service Implementation

```typescript
// modules/users/users.service.ts
async findAll(query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
  const { page = 1, limit = 20 } = query;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [isNull(users.deletedAt)];
  if (query.search) {
    conditions.push(ilike(users.name, `%${query.search}%`));
  }
  if (query.role) {
    conditions.push(eq(users.role, query.role));
  }

  const where = and(...conditions);

  const [data, [{ total }]] = await Promise.all([
    this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    this.db
      .select({ total: count() })
      .from(users)
      .where(where),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
```

### Controller

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }
}

// dto/user-query.dto.ts
export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

### Rules

- Run data query and count query in `Promise.all` — parallel execution
- Always cap `limit` with `@Max(100)` to prevent clients from requesting enormous pages
- Return `hasNext`/`hasPrev` booleans for easy client-side navigation
- Use offset pagination for admin dashboards and table UIs with page numbers
- Avoid offset pagination for large, frequently-updated datasets — rows shift between pages
- Extend `PaginationDto` in domain-specific query DTOs to add filters

---

## 7. Dynamic Sorting

Allow clients to specify sort field and direction via query parameters.

### Sort DTO

```typescript
// common/dto/sort.dto.ts
import { IsOptional, IsString, IsIn } from 'class-validator';

export class SortDto {
  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

### Safe Sort Map Pattern

```typescript
// modules/products/products.repository.ts
import { asc, desc, SQL } from 'drizzle-orm';

// Whitelist of sortable columns — prevents injection
const SORTABLE_COLUMNS = {
  name: products.name,
  price: products.price,
  createdAt: products.createdAt,
  stock: products.stock,
} as const;

type SortableField = keyof typeof SORTABLE_COLUMNS;

function buildOrderBy(sortBy?: string, sortOrder?: 'asc' | 'desc'): SQL[] {
  const column = SORTABLE_COLUMNS[sortBy as SortableField];
  if (!column) {
    return [desc(products.createdAt)]; // default sort
  }

  const direction = sortOrder === 'asc' ? asc : desc;
  return [direction(column)];
}

async findAll(query: ProductQueryDto) {
  const orderBy = buildOrderBy(query.sortBy, query.sortOrder);

  return this.db
    .select()
    .from(products)
    .orderBy(...orderBy)
    .limit(query.limit)
    .offset((query.page - 1) * query.limit);
}
```

### Multi-Column Sort

```typescript
// GET /products?sort=price:asc,createdAt:desc
export class ProductQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  sort?: string; // "price:asc,createdAt:desc"
}

function parseSort(sort?: string): SQL[] {
  if (!sort) return [desc(products.createdAt)];

  return sort.split(',').reduce<SQL[]>((acc, part) => {
    const [field, order] = part.split(':');
    const column = SORTABLE_COLUMNS[field as SortableField];
    if (column) {
      acc.push(order === 'asc' ? asc(column) : desc(column));
    }
    return acc;
  }, []);
}
```

### Rules

- Always use a whitelist/map of sortable columns — never pass user input directly to `orderBy`
- Provide a sensible default sort (usually `createdAt desc`) when no sort is specified
- Validate sort direction with `@IsIn(['asc', 'desc'])`
- For multi-column sort, use `field:direction` format with comma separation
- Ignore unknown sort fields silently — don't expose internal column names in error messages

---

## 8. Nested DTO Validation

Validate complex, nested request payloads with `class-validator` and `class-transformer`.

### Nested Object Validation

```typescript
// dto/create-order.dto.ts
import { Type } from 'class-transformer';
import { IsString, IsInt, Min, IsUUID, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';

class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

class ShippingAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsString()
  note?: string;
}
```

### Conditional Validation

```typescript
import { ValidateIf } from 'class-validator';

export class PaymentDto {
  @IsEnum(['credit_card', 'bank_transfer', 'paypal'])
  method: string;

  // Only validate card fields when method is credit_card
  @ValidateIf((o) => o.method === 'credit_card')
  @IsString()
  cardNumber: string;

  @ValidateIf((o) => o.method === 'credit_card')
  @IsString()
  expiryDate: string;

  @ValidateIf((o) => o.method === 'bank_transfer')
  @IsString()
  accountNumber: string;
}
```

### Custom Validation

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Custom decorator: ensure end date is after start date
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value > relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be after ${args.constraints[0]}`;
        },
      },
    });
  };
}

// Usage
export class DateRangeDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  @IsAfter('startDate', { message: 'endDate must be after startDate' })
  endDate: string;
}
```

### Global Validation Pipe Setup

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,         // strip undecorated properties
    forbidNonWhitelisted: true, // throw on unknown properties
    transform: true,         // auto-transform types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Rules

- Always use `@ValidateNested()` + `@Type(() => ChildDto)` for nested objects
- Use `{ each: true }` on arrays: `@ValidateNested({ each: true })`
- Set `whitelist: true` and `forbidNonWhitelisted: true` globally to reject unknown fields
- Use `@ValidateIf()` for conditional validation based on other fields
- Create custom decorators for cross-field validation (date ranges, password confirmation)
- Set `transform: true` so query string numbers are automatically converted

---

## 9. Partial Update DTOs

Use NestJS mapped types to derive update DTOs from create DTOs without duplication.

### PartialType

```typescript
// dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// All fields from CreateUserDto become optional
export class UpdateUserDto extends PartialType(CreateUserDto) {}
```

### Combining Mapped Types

```typescript
import { PartialType, OmitType, PickType, IntersectionType } from '@nestjs/mapped-types';

// Omit fields that shouldn't be updatable, then make the rest optional
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password'] as const),
) {}
// Result: { name?: string; avatarUrl?: string }

// Pick specific updatable fields
export class UpdateProfileDto extends PartialType(
  PickType(CreateUserDto, ['name', 'avatarUrl'] as const),
) {}

// Combine two DTOs
export class CreateTeamMemberDto extends IntersectionType(
  PickType(CreateUserDto, ['email', 'name'] as const),
  CreateTeamRoleDto,
) {}
```

### Handling Partial Updates in Service

```typescript
@Injectable()
export class UsersService {
  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    // dto only contains fields the client sent
    // Empty objects are valid (no-op update)
    if (Object.keys(dto).length === 0) {
      return this.findById(id);
    }

    const updated = await this.usersRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return UserResponseDto.from(updated);
  }
}
```

### Handling Nullable Fields

```typescript
// Allow setting a field to null explicitly
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  // Allow null to clear the avatar
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  avatarUrl?: string | null;
}
```

### Rules

- Use `PartialType` for standard PATCH update DTOs — inherits all validators as optional
- Use `OmitType` to exclude immutable fields (email, id) from update DTOs
- Import from `@nestjs/mapped-types` (not `@nestjs/swagger`) unless using Swagger
- If using Swagger, import from `@nestjs/swagger` instead — it extends mapped-types with API metadata
- Handle empty update objects gracefully — don't error on no-op updates
- Use `@ValidateIf((_, value) => value !== null)` to allow explicit `null` for clearing fields

---

## 10. Request and Response DTOs

Separate request DTOs (validation) from response DTOs (serialization) for clean API contracts.

### Request DTOs

```typescript
// modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

// modules/users/dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/mapped-types';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password']),
) {}
// Result: { name?: string; avatarUrl?: string }
```

### Response DTOs

```typescript
// modules/users/dto/user-response.dto.ts
import { Exclude, Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  avatarUrl: string | null;

  @Expose()
  role: string;

  @Expose()
  @Type(() => Date)
  createdAt: Date;

  // passwordHash is excluded by default (not listed with @Expose)
}

// Alternative: use plain mapping instead of class-transformer
export class UserResponseDto {
  static from(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  static fromMany(users: User[]): UserResponseDto[] {
    return users.map(UserResponseDto.from);
  }
}
```

### Service Usage

```typescript
@Injectable()
export class UsersService {
  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return UserResponseDto.from(user);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const passwordHash = await hash(dto.password);
    const user = await this.usersRepository.create({
      ...dto,
      passwordHash,
    });
    return UserResponseDto.from(user);
  }
}
```

### Rules

- Request DTOs validate input with `class-validator` decorators
- Response DTOs control output shape — never return raw database entities
- Use `PartialType` and `OmitType` from `@nestjs/mapped-types` to derive update DTOs
- Never expose sensitive fields (passwordHash, tokens, internal IDs) in response DTOs
- Use a static `from()` method on response DTOs for explicit mapping — simpler than `class-transformer`
- Keep DTOs in the module's `dto/` directory with clear naming: `create-*.dto.ts`, `update-*.dto.ts`, `*-response.dto.ts`

---

## 11. Business Exception Hierarchy

Create a domain-specific exception hierarchy to separate business errors from HTTP concerns.

### Base Business Exception

```typescript
// common/exceptions/business.exception.ts
export abstract class BusinessException extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}
```

### Domain Exceptions

```typescript
// common/exceptions/domain.exceptions.ts
import { HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends BusinessException {
  readonly code = 'ENTITY_NOT_FOUND';
  readonly httpStatus = HttpStatus.NOT_FOUND;

  constructor(entity: string, id: string) {
    super(`${entity} with ID ${id} not found`, { entity, id });
  }
}

export class DuplicateEntityException extends BusinessException {
  readonly code = 'DUPLICATE_ENTITY';
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} "${value}" already exists`, { entity, field, value });
  }
}

export class InsufficientStockException extends BusinessException {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly httpStatus = HttpStatus.UNPROCESSABLE_ENTITY;

  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}`, { productId, requested, available });
  }
}

export class InvalidStateTransitionException extends BusinessException {
  readonly code = 'INVALID_STATE_TRANSITION';
  readonly httpStatus = HttpStatus.CONFLICT;

  constructor(entity: string, currentState: string, targetState: string) {
    super(`Cannot transition ${entity} from ${currentState} to ${targetState}`);
  }
}
```

### Business Exception Filter

```typescript
// common/filters/business-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { BusinessException } from '../exceptions/business.exception';

@Catch(BusinessException)
export class BusinessExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    response.status(exception.httpStatus).json({
      error: {
        statusCode: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        details: exception.details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### Service Usage

```typescript
@Injectable()
export class OrdersService {
  async ship(orderId: string) {
    const order = await this.ordersRepo.findById(orderId);

    if (!order) {
      throw new EntityNotFoundException('Order', orderId);
    }

    if (order.status !== 'confirmed') {
      throw new InvalidStateTransitionException('Order', order.status, 'shipped');
    }

    return this.ordersRepo.updateStatus(orderId, 'shipped');
  }
}
```

### Rules

- Services throw business exceptions — they don't import `@nestjs/common` HTTP exceptions
- Each business exception has a unique `code` for client error handling (e.g., `INSUFFICIENT_STOCK`)
- The exception filter maps business exceptions to HTTP responses — services stay HTTP-agnostic
- Include `details` for machine-readable context (product ID, field name, available quantity)
- Keep the exception hierarchy flat — don't create deep inheritance chains

---

## 12. Exception Filters

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

---

## 13. Validation Pipe Configuration

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

---

## 14. Response Caching Interceptor

Cache API responses to reduce database load and improve response times.

### Built-in Cache Interceptor

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60_000,      // default 60 seconds
      max: 1000,         // max items in memory cache
    }),
  ],
})
export class AppModule {}
```

```typescript
// modules/products/products.controller.ts
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';

@Controller('products')
@UseInterceptors(CacheInterceptor) // cache all GET routes in this controller
export class ProductsController {
  @Get()
  @CacheTTL(30_000) // override: 30 seconds for listings
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @CacheTTL(120_000) // 2 minutes for single product
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    // Cache is automatically bypassed for non-GET requests
    return product;
  }
}
```

### Custom Cache Interceptor

```typescript
// common/interceptors/custom-cache.interceptor.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  // Include query params in cache key
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();

    // Don't cache authenticated requests by default
    if (request.user) {
      return undefined;
    }

    // Cache key = URL + query string
    return request.url;
  }
}
```

### Manual Cache Management

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async findById(id: string) {
    const cacheKey = `product:${id}`;

    // Check cache
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) return cached;

    // Fetch and cache
    const product = await this.productsRepo.findById(id);
    if (product) {
      await this.cache.set(cacheKey, product, 120_000);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.productsRepo.update(id, dto);
    // Invalidate cache on mutation
    await this.cache.del(`product:${id}`);
    return updated;
  }
}
```

### Rules

- Use `@UseInterceptors(CacheInterceptor)` for simple GET endpoint caching
- Override `trackBy` to include query params and exclude authenticated requests
- Invalidate cache on mutations (create, update, delete) — stale data is worse than no cache
- Use `CacheModule.register()` for in-memory caching, `CacheModule.registerAsync()` with Redis for distributed
- Set reasonable TTLs: listings (30s), individual records (2-5min), static reference data (30min)
- Don't cache user-specific or personalized responses with the built-in interceptor

---

## 15. Cache Invalidation Strategies

Reliable cache invalidation prevents stale data while maintaining cache benefits.

### Event-Based Invalidation

```typescript
// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.repo.update(id, dto);
    this.eventEmitter.emit('product.updated', { productId: id });
    return updated;
  }

  async delete(id: string) {
    await this.repo.delete(id);
    this.eventEmitter.emit('product.deleted', { productId: id });
  }
}

// common/listeners/cache-invalidation.listener.ts
@Injectable()
export class CacheInvalidationListener {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  @OnEvent('product.updated')
  @OnEvent('product.deleted')
  async onProductChange(payload: { productId: string }) {
    await this.cache.del(`products:${payload.productId}`);
    await this.cache.del('products:featured');
    // Invalidate any list caches that might contain this product
  }

  @OnEvent('order.completed')
  async onOrderCompleted(payload: { productIds: string[] }) {
    // Invalidate stock-related caches
    await Promise.all(
      payload.productIds.map((id) => this.cache.del(`products:${id}`)),
    );
  }
}
```

### Write-Through Pattern

```typescript
@Injectable()
export class ProductsCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly repo: ProductsRepository,
  ) {}

  // Write-through: update DB and cache atomically
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const updated = await this.repo.update(id, dto);

    if (updated) {
      // Update cache with fresh data instead of just invalidating
      await this.cache.set(`products:${id}`, updated, 300_000);
    }

    return updated;
  }

  // Read-through: check cache first, populate on miss
  async findById(id: string): Promise<Product | null> {
    const cached = await this.cache.get<Product>(`products:${id}`);
    if (cached) return cached;

    const product = await this.repo.findById(id);
    if (product) {
      await this.cache.set(`products:${id}`, product, 300_000);
    }
    return product;
  }
}
```

### TTL-Based Expiry for Listings

```typescript
// For data that's acceptable to be slightly stale
@Injectable()
export class DashboardService {
  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const stats = await this.computeExpensiveStats();
    await this.cache.set(cacheKey, stats, 60_000); // refresh every minute
    return stats;
  }
}
```

### Rules

- Use event-based invalidation for data that must be fresh after mutations
- Use TTL-based expiry for data that can tolerate brief staleness (dashboards, analytics)
- Write-through caching updates the cache alongside the DB — no window of stale data
- Centralize invalidation logic in event listeners — don't scatter `cache.del` across services
- Always have a TTL even with event-based invalidation — safety net against missed events
- Invalidate aggressively — a cache miss is cheap, serving stale data causes bugs

---

## 16. Redis Caching

Use Redis for distributed caching across multiple application instances.

### Setup

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('redis.host'),
            port: config.get('redis.port'),
          },
          password: config.get('redis.password'),
          ttl: 60_000,
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

### Cache-Aside Pattern

```typescript
@Injectable()
export class ProductCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly productsRepo: ProductsRepository,
  ) {}

  private key(id: string) {
    return `products:${id}`;
  }

  private listKey(params: string) {
    return `products:list:${params}`;
  }

  async findById(id: string): Promise<Product | null> {
    const cached = await this.cache.get<Product>(this.key(id));
    if (cached) return cached;

    const product = await this.productsRepo.findById(id);
    if (product) {
      await this.cache.set(this.key(id), product, 300_000); // 5 min
    }
    return product;
  }

  async invalidate(id: string) {
    await this.cache.del(this.key(id));
  }

  async invalidateList() {
    // Use Redis SCAN to find and delete list keys
    const store = this.cache.store as any;
    if (store.keys) {
      const keys = await store.keys('products:list:*');
      if (keys.length) {
        await Promise.all(keys.map((k: string) => this.cache.del(k)));
      }
    }
  }
}
```

### Cache Decorator Pattern

```typescript
// common/decorators/cacheable.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_OPTIONS_KEY = 'cache_options';

export interface CacheOptions {
  key: string;
  ttl?: number;
}

export const Cacheable = (options: CacheOptions) =>
  SetMetadata(CACHE_OPTIONS_KEY, options);

// Usage
@Injectable()
export class ProductsService {
  @Cacheable({ key: 'products:featured', ttl: 300_000 })
  async getFeaturedProducts() {
    return this.productsRepo.findFeatured();
  }
}
```

### Rules

- Use `cache-manager-redis-yet` for Redis integration with `@nestjs/cache-manager`
- Use key prefixes with colons for namespace organization: `products:${id}`, `users:${id}`
- Invalidate individual keys on mutations, pattern-based invalidation for lists
- Set TTLs appropriate to data volatility — frequently changing data gets shorter TTLs
- Use Redis for multi-instance deployments — in-memory cache only works for single instances
- Consider Redis Cluster for high-availability production deployments

---

## 17. Header-Based Versioning

Version APIs using custom headers for clean URLs while supporting version negotiation.

### Setup

```typescript
// main.ts
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
  defaultVersion: '1',
});

// Clients send: X-API-Version: 2
// Routes stay clean: /users (no version in URL)
```

### Media Type Versioning

```typescript
// Alternative: version via Accept header
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
  defaultVersion: '1',
});

// Client sends: Accept: application/json;v=2
```

### Controller Usage

```typescript
@Controller('users')
export class UsersController {
  @Get()
  @Version('1')
  findAllV1(@Query() query: PaginationDto) {
    return this.usersService.findAllV1(query);
  }

  @Get()
  @Version('2')
  findAllV2(@Query() query: PaginationDto) {
    // V2 returns different response shape
    return this.usersService.findAllV2(query);
  }
}
```

### Version Deprecation Header

```typescript
// common/interceptors/deprecation.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  constructor(private readonly deprecatedVersions: string[]) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const version = request.headers['x-api-version'] ?? '1';

    if (this.deprecatedVersions.includes(version)) {
      response.setHeader('Sunset', 'Sat, 01 Jun 2026 00:00:00 GMT');
      response.setHeader('Deprecation', 'true');
      response.setHeader('Link', '</v2/docs>; rel="successor-version"');
    }

    return next.handle();
  }
}
```

### Rules

- Use header versioning for internal APIs — keeps URLs clean and stable
- Use media type versioning for APIs following strict REST/HATEOAS patterns
- Always set a `defaultVersion` for requests without version headers
- Add `Sunset` and `Deprecation` headers when deprecating old versions
- Document required headers clearly in API documentation
- Prefer URI versioning for public APIs — headers are less discoverable for third-party consumers

---

## 18. URI Versioning

Version APIs via URI prefix for clear, explicit version separation.

### Setup

```typescript
// main.ts
import { VersioningType } from '@nestjs/common';

app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
  prefix: 'v',
});

// Routes become: /v1/users, /v2/users
```

### Controller Versioning

```typescript
// modules/users/users-v1.controller.ts
@Controller('users')
@Version('1')
export class UsersV1Controller {
  @Get()
  findAll() {
    // Returns flat user object
    return this.usersService.findAllV1();
  }
}

// modules/users/users-v2.controller.ts
@Controller('users')
@Version('2')
export class UsersV2Controller {
  @Get()
  findAll() {
    // Returns user with nested profile
    return this.usersService.findAllV2();
  }
}
```

### Route-Level Versioning

```typescript
@Controller('users')
export class UsersController {
  // Available at /v1/users AND /v2/users
  @Get()
  @Version(['1', '2'])
  findAll() {
    return this.usersService.findAll();
  }

  // Only available at /v2/users/search
  @Get('search')
  @Version('2')
  search(@Query() query: SearchDto) {
    return this.usersService.search(query);
  }
}
```

### Version-Neutral Routes

```typescript
// Health check available at all versions
@Controller('health')
@Version(VERSION_NEUTRAL)
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### Rules

- Use URI versioning (`/v1/`, `/v2/`) for public APIs — most explicit and discoverable
- Set `defaultVersion: '1'` so unversioned routes map to v1
- Version at the controller level when most routes change between versions
- Version at the route level when only specific endpoints change
- Use `VERSION_NEUTRAL` for routes that don't change between versions (health, docs)
- Keep old versions working until clients migrate — deprecate with response headers before removing

---

## 19. Custom Rate Limiting

Implement custom rate limiting for advanced scenarios like per-API-key limits and tiered plans.

### Tiered Rate Limiting

```typescript
// common/guards/tiered-throttler.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

const PLAN_LIMITS: Record<string, { limit: number; ttl: number }> = {
  free: { limit: 100, ttl: 3600_000 },       // 100/hour
  pro: { limit: 1000, ttl: 3600_000 },       // 1000/hour
  enterprise: { limit: 10000, ttl: 3600_000 }, // 10000/hour
};

@Injectable()
export class TieredThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.headers['x-api-key'] ?? req.ip;
  }

  protected async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest();
    const plan = request.user?.plan ?? 'free';
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    // Override limits based on user plan
    requestProps.limit = limits.limit;
    requestProps.ttl = limits.ttl;

    return super.handleRequest(requestProps);
  }
}
```

### API Key Rate Limiting

```typescript
// common/guards/api-key-rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) return true; // Let auth guard handle missing keys

    const key = `rate:${apiKey}`;
    const windowMs = 60_000; // 1 minute

    const current = await this.cache.get<number>(key) ?? 0;
    const limit = 60; // 60 requests per minute

    if (current >= limit) {
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', limit);
      response.setHeader('X-RateLimit-Remaining', 0);
      response.setHeader('Retry-After', 60);

      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.cache.set(key, current + 1, windowMs);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', limit - current - 1);

    return true;
  }
}
```

### Rate Limit Response Headers

```typescript
// common/interceptors/rate-limit-headers.interceptor.ts
@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();

    // Headers set by guards are preserved
    // Add standard headers if not already set
    if (!response.getHeader('X-RateLimit-Limit')) {
      response.setHeader('X-RateLimit-Limit', 100);
    }

    return next.handle();
  }
}
```

### Rules

- Use `@nestjs/throttler` for standard rate limiting — build custom only for tiered/API-key scenarios
- Always include rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- Use Redis for rate limit counters in multi-instance deployments
- Implement tiered limits based on user plan — free, pro, enterprise
- Rate limit by API key or user ID, not just IP — shared IPs cause unfair blocking
- Log rate limit violations for abuse detection and capacity planning

---

## 20. Rate Limiting with Throttler

Use `@nestjs/throttler` to protect APIs from abuse and ensure fair resource distribution.

### Setup

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1_000,    // 1 second window
        limit: 3,       // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10_000,   // 10 second window
        limit: 20,      // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60_000,   // 1 minute window
        limit: 100,     // 100 requests per minute
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Per-Route Overrides

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  // Strict rate limit on login — prevent brute force
  @Post('login')
  @Throttle({ short: { limit: 1, ttl: 1000 }, medium: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Skip throttling for public health checks
  @Get('status')
  @SkipThrottle()
  status() {
    return { status: 'ok' };
  }
}

// Skip throttling for entire controller
@Controller('webhooks')
@SkipThrottle()
export class WebhooksController {}
```

### Redis-Backed Throttler (Multi-Instance)

```typescript
// app.module.ts
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

ThrottlerModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: 'short', ttl: 1_000, limit: 3 },
      { name: 'long', ttl: 60_000, limit: 100 },
    ],
    storage: new ThrottlerStorageRedisService({
      host: config.get('redis.host'),
      port: config.get('redis.port'),
    }),
  }),
}),
```

### Custom Throttle Key (by User)

```typescript
// common/guards/user-throttler.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by authenticated user ID, fallback to IP
    return req.user?.id ?? req.ip;
  }
}
```

### Rules

- Use multiple time windows (short + long) for layered protection
- Apply strict limits on auth endpoints (login, register, password reset)
- Use `@SkipThrottle()` for webhooks and internal health checks
- Use Redis storage when running multiple app instances — in-memory only works for single instance
- Customize `getTracker` to rate limit by user ID instead of IP for authenticated endpoints
- Return `429 Too Many Requests` with `Retry-After` header (handled automatically by throttler)

---

## 21. File Uploads with Multer

Handle file uploads using NestJS built-in Multer integration.

### Single File Upload

```typescript
// modules/users/users.controller.ts
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('users')
export class UsersController {
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.usersService.updateAvatar(id, file);
  }
}
```

### Multiple File Upload

```typescript
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductsController {
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10, { // max 10 files
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('At least one file is required');
    return this.productsService.addImages(id, files);
  }
}
```

### File Validation Pipe

```typescript
// common/pipes/file-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly options: {
      maxSize?: number;
      allowedMimes?: string[];
      required?: boolean;
    },
  ) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      if (this.options.required) {
        throw new BadRequestException('File is required');
      }
      return file;
    }

    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new BadRequestException(
        `File size ${file.size} exceeds maximum ${this.options.maxSize}`,
      );
    }

    if (this.options.allowedMimes && !this.options.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed: ${this.options.allowedMimes.join(', ')}`,
      );
    }

    return file;
  }
}

// Usage
@UploadedFile(new FileValidationPipe({
  maxSize: 5 * 1024 * 1024,
  allowedMimes: ['image/jpeg', 'image/png'],
  required: true,
}))
file: Express.Multer.File
```

### S3 Upload Service

```typescript
@Injectable()
export class StorageService {
  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {}

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${randomUUID()}-${file.originalname}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.config.get('s3.bucket'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `https://${this.config.get('s3.bucket')}.s3.amazonaws.com/${key}`;
  }
}
```

### Rules

- Always set `fileSize` limits — prevent memory exhaustion from large uploads
- Validate file MIME types in `fileFilter` — don't trust file extensions
- Use `ParseFilePipe` or custom validation pipes for reusable file validation
- Store files in S3/cloud storage — don't save to local disk in production
- Generate unique filenames (UUID) to prevent collisions and path traversal
- Return the file URL in the response, not the file itself

---

## 22. Streaming Uploads and Downloads

Handle large files efficiently with streams instead of buffering entire files in memory.

### Streaming Upload to S3

```typescript
// modules/storage/storage.service.ts
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  async uploadStream(
    stream: Readable,
    key: string,
    contentType: string,
  ): Promise<string> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.config.get('s3.bucket'),
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024, // 5MB parts
    });

    upload.on('httpUploadProgress', (progress) => {
      this.logger.debug(`Upload progress: ${progress.loaded}/${progress.total}`);
    });

    await upload.done();
    return key;
  }
}
```

### Streaming File Download

```typescript
// modules/files/files.controller.ts
import { StreamableFile, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getMetadata(id);
    if (!file) throw new NotFoundException();

    const stream = await this.storageService.getStream(file.storageKey);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': file.size,
    });

    return new StreamableFile(stream);
  }
}
```

### CSV Export Streaming

```typescript
@Controller('reports')
export class ReportsController {
  @Get('users/export')
  async exportUsers(@Res({ passthrough: true }) res: Response) {
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="users.csv"',
    });

    const stream = new PassThrough();

    // Write header
    stream.write('id,name,email,created_at\n');

    // Stream data in chunks to avoid loading all into memory
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    (async () => {
      while (hasMore) {
        const users = await this.usersService.findBatch(offset, batchSize);
        for (const user of users) {
          stream.write(`${user.id},${user.name},${user.email},${user.createdAt.toISOString()}\n`);
        }
        offset += batchSize;
        hasMore = users.length === batchSize;
      }
      stream.end();
    })();

    return new StreamableFile(stream);
  }
}
```

### Rules

- Use `StreamableFile` for all file download responses — NestJS handles proper streaming
- Use `@Res({ passthrough: true })` to set headers while still using NestJS response handling
- Stream large uploads directly to storage (S3) — don't buffer in memory
- Use `@aws-sdk/lib-storage` `Upload` class for multipart S3 uploads with progress tracking
- Stream exports (CSV, JSON) in batches — don't load entire datasets into memory
- Set proper `Content-Type`, `Content-Disposition`, and `Content-Length` headers on downloads

---

## 23. DataLoader for N+1 Prevention

Use DataLoader to batch and cache database requests within a single GraphQL query execution.

### DataLoader Setup

```typescript
// modules/users/users.loader.ts
import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { UsersRepository } from './users.repository';

@Injectable({ scope: Scope.REQUEST }) // new instance per request
export class UsersLoader {
  constructor(private readonly usersRepo: UsersRepository) {}

  readonly byId = new DataLoader<string, User | null>(async (ids) => {
    const users = await this.usersRepo.findByIds([...ids]);
    const userMap = new Map(users.map((u) => [u.id, u]));
    return ids.map((id) => userMap.get(id) ?? null);
  });
}
```

### Using DataLoader in Resolvers

```typescript
// modules/posts/posts.resolver.ts
@Resolver(() => PostModel)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly usersLoader: UsersLoader,
  ) {}

  @Query(() => [PostModel])
  posts() {
    return this.postsService.findAll();
  }

  // Without DataLoader: N queries for N posts
  // With DataLoader: 1 batched query for all unique author IDs
  @ResolveField(() => UserModel)
  author(@Parent() post: PostModel) {
    return this.usersLoader.byId.load(post.authorId);
  }
}
```

### Repository Batch Method

```typescript
// modules/users/users.repository.ts
async findByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];

  return this.db
    .select()
    .from(users)
    .where(inArray(users.id, ids));
}
```

### Multiple DataLoaders

```typescript
@Injectable({ scope: Scope.REQUEST })
export class PostsLoader {
  constructor(private readonly postsRepo: PostsRepository) {}

  // Load posts by author
  readonly byAuthorId = new DataLoader<string, Post[]>(async (authorIds) => {
    const posts = await this.postsRepo.findByAuthorIds([...authorIds]);
    const grouped = new Map<string, Post[]>();
    for (const post of posts) {
      const list = grouped.get(post.authorId) ?? [];
      list.push(post);
      grouped.set(post.authorId, list);
    }
    return authorIds.map((id) => grouped.get(id) ?? []);
  });

  // Load post count by author
  readonly countByAuthorId = new DataLoader<string, number>(async (authorIds) => {
    const counts = await this.postsRepo.countByAuthorIds([...authorIds]);
    const countMap = new Map(counts.map((c) => [c.authorId, c.count]));
    return authorIds.map((id) => countMap.get(id) ?? 0);
  });
}
```

### Module Registration

```typescript
@Module({
  providers: [
    PostsResolver,
    PostsService,
    PostsLoader,
    UsersLoader,
  ],
})
export class PostsModule {}
```

### Rules

- Use `Scope.REQUEST` on DataLoaders — they must not share cached data across requests
- DataLoader batch functions must return results in the same order as the input keys
- Return `null` for missing records — don't throw in the batch function
- Create separate DataLoaders for different query patterns (by ID, by foreign key, counts)
- Register DataLoaders as providers in the module — inject them into resolvers
- DataLoader solves N+1 for GraphQL field resolvers — not needed for REST endpoints

---

## 24. GraphQL Resolvers

Build GraphQL APIs with NestJS using the code-first approach for full TypeScript integration.

### Setup

```typescript
// app.module.ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true, // code-first: generate schema from decorators
      sortSchema: true,
      playground: process.env.NODE_ENV === 'development',
    }),
  ],
})
export class AppModule {}
```

### Object Types

```typescript
// modules/users/models/user.model.ts
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class UserModel {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field()
  createdAt: Date;

  // passwordHash is not decorated — excluded from schema
}
```

### Resolver

```typescript
// modules/users/users.resolver.ts
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';

@Resolver(() => UserModel)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [UserModel], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => UserModel, { name: 'user', nullable: true })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.findById(id);
  }

  @Mutation(() => UserModel)
  createUser(@Args('input') input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Mutation(() => UserModel)
  updateUser(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateUserInput,
  ) {
    return this.usersService.update(id, input);
  }

  @Mutation(() => Boolean)
  deleteUser(@Args('id', { type: () => ID }) id: string) {
    return this.usersService.remove(id);
  }
}
```

### Input Types

```typescript
// modules/users/dto/create-user.input.ts
import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(2)
  name: string;

  @Field()
  @MinLength(8)
  password: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  avatarUrl?: string;
}
```

### Field Resolver

```typescript
@Resolver(() => UserModel)
export class UsersResolver {
  @ResolveField(() => [PostModel])
  posts(@Parent() user: UserModel) {
    return this.postsService.findByAuthor(user.id);
  }

  @ResolveField(() => Int)
  postCount(@Parent() user: UserModel) {
    return this.postsService.countByAuthor(user.id);
  }
}
```

### Rules

- Use code-first approach (`autoSchemaFile: true`) for TypeScript-native development
- Decorate only public fields with `@Field()` — undecorated fields are excluded from the schema
- Use `@InputType()` for mutations, `@ObjectType()` for responses
- Use `@ResolveField()` for computed fields and relationships
- Keep resolvers thin — delegate to services, same as REST controllers
- Combine `class-validator` with GraphQL input types for validation

---

## 25. GraphQL Subscriptions

Implement real-time data push with GraphQL subscriptions over WebSocket.

### Setup

```typescript
// app.module.ts
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (context) => {
            // Authenticate WebSocket connections
            const token = context.connectionParams?.authorization as string;
            if (!token) throw new Error('Missing auth token');
          },
        },
      },
    }),
  ],
})
export class AppModule {}
```

### PubSub Setup

```typescript
// common/pubsub/pubsub.module.ts
import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

export const PUB_SUB = Symbol('PUB_SUB');

@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: new PubSub(),
    },
  ],
  exports: [PUB_SUB],
})
export class PubSubModule {}

// For production with multiple instances, use Redis PubSub:
// import { RedisPubSub } from 'graphql-redis-subscriptions';
```

### Subscription Resolver

```typescript
// modules/messages/messages.resolver.ts
import { Resolver, Mutation, Subscription, Args } from '@nestjs/graphql';
import { Inject } from '@nestjs/common';
import { PUB_SUB } from '@/common/pubsub/pubsub.module';
import { PubSub } from 'graphql-subscriptions';

@Resolver(() => MessageModel)
export class MessagesResolver {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  @Mutation(() => MessageModel)
  async sendMessage(@Args('input') input: SendMessageInput) {
    const message = await this.messagesService.create(input);

    // Publish to subscribers
    await this.pubSub.publish('messageAdded', {
      messageAdded: message,
      channelId: input.channelId,
    });

    return message;
  }

  @Subscription(() => MessageModel, {
    // Filter: only receive messages for subscribed channel
    filter: (payload, variables) => {
      return payload.channelId === variables.channelId;
    },
  })
  messageAdded(@Args('channelId') channelId: string) {
    return this.pubSub.asyncIterableIterator('messageAdded');
  }
}
```

### Rules

- Use `graphql-ws` protocol (not the deprecated `subscriptions-transport-ws`)
- Authenticate WebSocket connections in `onConnect` — validate tokens before allowing subscriptions
- Use `filter` on subscriptions to scope events (e.g., only messages in a specific channel)
- Use in-memory `PubSub` for development, Redis-backed `RedisPubSub` for production multi-instance
- Publish events from mutations or services after successful operations
- Keep subscription payloads small — clients can query for full data after receiving the notification

---

## 26. OpenAPI/Swagger Decorators

Auto-generate API documentation using NestJS Swagger decorators.

### Setup

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('My API')
      .setDescription('API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('users', 'User management')
      .addTag('auth', 'Authentication')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(3000);
}
```

### Controller Decorators

```typescript
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Paginated user list', type: PaginatedUserResponse })
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User found', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
```

### DTO Decorators

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Unique email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'Str0ng!Pass', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
```

### Swagger CLI Plugin (Auto-inference)

```json
// nest-cli.json — auto-generate ApiProperty from class-validator decorators
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true
        }
      }
    ]
  }
}
```

### Rules

- Use the Swagger CLI plugin to auto-infer `@ApiProperty` from class-validator decorators
- Add `@ApiTags` to every controller for organized documentation
- Document all response codes with `@ApiResponse` — especially error codes
- Use `@ApiBearerAuth()` on authenticated controllers
- Only enable Swagger in development — disable in production for security
- Import `PartialType`, `OmitType` from `@nestjs/swagger` (not `@nestjs/mapped-types`) when using Swagger

---

## 27. OpenAPI Schema Definitions

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

---
