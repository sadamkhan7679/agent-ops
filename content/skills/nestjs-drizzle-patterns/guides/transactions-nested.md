---
title: Nested Transactions and Savepoints
tags: transactions, nested, savepoints, partial-rollback
---

## Nested Transactions and Savepoints

Use savepoints for partial rollback within a larger transaction.

### Savepoint Pattern

```typescript
async processOrderWithOptionalGift(userId: string, orderDto: CreateOrderDto) {
  return this.db.transaction(async (tx) => {
    // Main order — must succeed
    const [order] = await tx
      .insert(orders)
      .values({
        userId,
        total: orderDto.total,
        status: 'confirmed',
      })
      .returning();

    await tx.insert(orderItems).values(
      orderDto.items.map((item) => ({ orderId: order.id, ...item })),
    );

    // Gift wrapping — optional, should not fail the order
    if (orderDto.giftMessage) {
      try {
        await tx.transaction(async (nested) => {
          // This creates a SAVEPOINT
          const [gift] = await nested
            .insert(giftWrappings)
            .values({
              orderId: order.id,
              message: orderDto.giftMessage,
              style: orderDto.giftStyle ?? 'standard',
            })
            .returning();

          await nested
            .update(orders)
            .set({ total: sql`${orders.total} + 5.00` })
            .where(eq(orders.id, order.id));
        });
      } catch (error) {
        // Savepoint rolled back, but outer transaction continues
        // Order is created without gift wrapping
        console.warn('Gift wrapping failed, continuing without:', error.message);
      }
    }

    return order;
  });
}
```

### Service Composition with Transactions

```typescript
// Pass the transaction to other services/repositories
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly inventoryService: InventoryService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async checkout(userId: string, cartItems: CartItem[]) {
    return this.db.transaction(async (tx) => {
      // Each method accepts the transaction
      const order = await this.ordersRepo.create(tx, { userId, status: 'pending' });
      await this.inventoryService.reserveStock(tx, cartItems);
      await this.ordersRepo.addItems(tx, order.id, cartItems);
      await this.ordersRepo.updateTotal(tx, order.id);

      return order;
    });
  }
}

// Repository accepts optional transaction
@Injectable()
export class OrdersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(txOrDb: DrizzleDB, data: NewOrder) {
    const [order] = await txOrDb.insert(orders).values(data).returning();
    return order;
  }
}
```

### Transaction-Aware Repository Base

```typescript
@Injectable()
export abstract class BaseRepository {
  constructor(@Inject(DRIZZLE) protected readonly db: DrizzleDB) {}

  // Allow callers to pass a transaction or use the default db
  protected getDb(tx?: DrizzleDB): DrizzleDB {
    return tx ?? this.db;
  }
}

// Usage
@Injectable()
export class UsersRepository extends BaseRepository {
  async create(data: NewUser, tx?: DrizzleDB) {
    const [user] = await this.getDb(tx).insert(users).values(data).returning();
    return user;
  }
}
```

### Rules

- Drizzle supports nested `tx.transaction()` calls — they map to PostgreSQL SAVEPOINTs
- Catch errors from nested transactions to allow partial failure without rolling back the outer transaction
- Pass `tx` through to repositories/services that participate in the same transaction
- Use a `getDb(tx?)` helper pattern for repositories that work both inside and outside transactions
- Never start a new `db.transaction()` inside an existing one — use the passed `tx` to nest properly
