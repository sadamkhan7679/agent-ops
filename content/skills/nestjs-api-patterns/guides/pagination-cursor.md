---
title: Cursor-Based Pagination
tags: pagination, cursor, infinite-scroll, performance
---

## Cursor-Based Pagination

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
