---
title: Domain Repository Patterns
tags: repository, domain, queries, business-logic
---

## Domain Repository Patterns

Domain repositories encapsulate complex queries specific to a bounded context.

### Domain Repository

```typescript
// modules/orders/orders.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDB } from '@/shared/database/drizzle.provider';
import { orders, orderItems, products, users } from '@/shared/database/schema';
import { and, eq, gte, lte, desc, sql, count, sum, SQL } from 'drizzle-orm';

@Injectable()
export class OrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findWithItems(orderId: string) {
    return this.db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: {
              columns: { id: true, name: true, price: true },
            },
          },
        },
        user: {
          columns: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByUser(userId: string, params: { page: number; limit: number; status?: string }) {
    const conditions: SQL[] = [eq(orders.userId, userId)];
    if (params.status) {
      conditions.push(eq(orders.status, params.status));
    }

    const where = and(...conditions);
    const offset = (params.page - 1) * params.limit;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(orders)
        .where(where)
        .orderBy(desc(orders.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(orders).where(where),
    ]);

    return {
      data,
      meta: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) },
    };
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    return this.db
      .select({
        date: sql<string>`date_trunc('day', ${orders.createdAt})::date`,
        orderCount: count(),
        revenue: sum(orders.total),
      })
      .from(orders)
      .where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        eq(orders.status, 'completed'),
      ))
      .groupBy(sql`date_trunc('day', ${orders.createdAt})::date`)
      .orderBy(sql`date_trunc('day', ${orders.createdAt})::date`);
  }

  async getBestSellers(limit: number = 10) {
    return this.db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        totalSold: sum(orderItems.quantity),
        totalRevenue: sql<string>`sum(${orderItems.quantity} * ${orderItems.unitPrice})`,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orders.status, 'completed'))
      .groupBy(orderItems.productId, products.name)
      .orderBy(sql`sum(${orderItems.quantity}) DESC`)
      .limit(limit);
  }

  async updateStatus(orderId: string, status: string, tx?: DrizzleDB) {
    const db = tx ?? this.db;
    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId))
      .returning();
    return updated ?? null;
  }
}
```

### Rules

- One repository per aggregate root — `OrdersRepository` owns queries for orders and order items
- Repositories return data — they don't throw HTTP exceptions (that's the service's job)
- Encapsulate query complexity — services should call `getRevenueReport()`, not build SQL
- Accept `tx?` parameter on write methods for transaction support
- Use relational queries (`db.query.*`) for nested data, query builder for aggregations and joins
- Keep repository methods focused — one query per method, name describes the result
