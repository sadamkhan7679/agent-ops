---
title: Dynamic Sorting
tags: pagination, sorting, order-by, query-params
---

## Dynamic Sorting

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
