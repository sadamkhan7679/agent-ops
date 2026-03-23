---
title: Repository Pattern for Data Access
tags: layers, repository, data-access, drizzle, queries
---

## Repository Pattern for Data Access

Repositories abstract database queries behind a typed interface. Services never write raw queries — they call repository methods.

### Base Repository Pattern

```typescript
// shared/database/base.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from './drizzle.provider';
import { eq, type SQL } from 'drizzle-orm';
import { type PgTable } from 'drizzle-orm/pg-core';

@Injectable()
export abstract class BaseRepository<TTable extends PgTable, TInsert, TSelect> {
  constructor(@Inject(DRIZZLE) protected readonly db: DrizzleDB) {}

  protected abstract table: TTable;

  async findById(id: string): Promise<TSelect | undefined> {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id))
      .limit(1);
    return result as TSelect | undefined;
  }

  async create(data: TInsert): Promise<TSelect> {
    const [result] = await this.db.insert(this.table).values(data as any).returning();
    return result as TSelect;
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect | undefined> {
    const [result] = await this.db
      .update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning();
    return result as TSelect | undefined;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(this.table).where(eq((this.table as any).id, id));
  }
}
```

### Domain Repository

```typescript
// modules/users/users.repository.ts
@Injectable()
export class UsersRepository extends BaseRepository<
  typeof users,
  typeof users.$inferInsert,
  typeof users.$inferSelect
> {
  protected table = users;

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findWithOrders(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: { orders: { limit: 10, orderBy: desc(orders.createdAt) } },
    });
  }

  async search(query: UserQueryDto) {
    const conditions: SQL[] = [];
    if (query.name) conditions.push(ilike(users.name, `%${query.name}%`));
    if (query.role) conditions.push(eq(users.role, query.role));

    return this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(query.offset);
  }
}
```

Rules:
- One repository per domain entity
- Repositories return raw data (entities), not DTOs
- Complex joins and aggregations live in the repository
- Business logic (authorization, validation) stays in the service
- Use the base repository for common CRUD, extend for domain-specific queries
