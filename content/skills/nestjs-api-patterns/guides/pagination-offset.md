---
title: Offset-Based Pagination
tags: pagination, offset, page, limit
---

## Offset-Based Pagination

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
