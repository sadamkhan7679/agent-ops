---
title: Generic Base Repository
tags: repository, base, generic, crud
---

## Generic Base Repository

A generic base repository provides standard CRUD operations for any Drizzle table.

### Base Repository

```typescript
// shared/database/base.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from './drizzle.provider';
import { eq, sql, count, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

export interface PaginationParams {
  page: number;
  limit: number;
  where?: SQL;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export abstract class BaseRepository<
  TTable extends PgTable,
  TSelect = TTable['$inferSelect'],
  TInsert = TTable['$inferInsert'],
> {
  constructor(
    @Inject(DRIZZLE) protected readonly db: DrizzleDB,
    protected readonly table: TTable,
  ) {}

  async findById(id: string): Promise<TSelect | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id));
    return (record as TSelect) ?? null;
  }

  async findAll(where?: SQL): Promise<TSelect[]> {
    const query = this.db.select().from(this.table);
    if (where) query.where(where);
    return query as unknown as TSelect[];
  }

  async findPaginated(params: PaginationParams): Promise<PaginatedResult<TSelect>> {
    const { page, limit, where } = params;
    const offset = (page - 1) * limit;

    const dataQuery = this.db.select().from(this.table).limit(limit).offset(offset);
    const countQuery = this.db.select({ total: count() }).from(this.table);

    if (where) {
      dataQuery.where(where);
      countQuery.where(where);
    }

    const [data, [{ total }]] = await Promise.all([dataQuery, countQuery]);

    return {
      data: data as unknown as TSelect[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: TInsert, tx?: DrizzleDB): Promise<TSelect> {
    const db = tx ?? this.db;
    const [record] = await db.insert(this.table).values(data as any).returning();
    return record as TSelect;
  }

  async update(id: string, data: Partial<TInsert>, tx?: DrizzleDB): Promise<TSelect | null> {
    const db = tx ?? this.db;
    const [record] = await db
      .update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning();
    return (record as TSelect) ?? null;
  }

  async delete(id: string, tx?: DrizzleDB): Promise<TSelect | null> {
    const db = tx ?? this.db;
    const [record] = await db
      .delete(this.table)
      .where(eq((this.table as any).id, id))
      .returning();
    return (record as TSelect) ?? null;
  }
}
```

### Usage

```typescript
// modules/users/users.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@/shared/database/base.repository';
import { users, User, NewUser } from '@/shared/database/schema';

@Injectable()
export class UsersRepository extends BaseRepository<typeof users, User, NewUser> {
  constructor(@Inject(DRIZZLE) db: DrizzleDB) {
    super(db, users);
  }

  // Domain-specific queries
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ?? null;
  }

  async findActiveUsers(page: number, limit: number) {
    return this.findPaginated({
      page,
      limit,
      where: eq(users.isActive, true),
    });
  }
}
```

### Rules

- The base repository handles generic CRUD — domain repositories add specific queries
- Accept optional `tx` parameter for transaction support on mutations
- Use `$inferSelect` and `$inferInsert` types from the table for full type safety
- Don't force every query through the base — write custom methods for complex queries
- Keep the base repository abstract — never inject it directly, always extend it
