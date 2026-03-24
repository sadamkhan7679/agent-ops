---
title: Filtering and Search
tags: pagination, filtering, search, query-params
---

## Filtering and Search

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
