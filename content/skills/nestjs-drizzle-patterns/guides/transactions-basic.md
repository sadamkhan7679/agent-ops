---
title: Basic Transactions
tags: transactions, atomicity, consistency, rollback
---

## Basic Transactions

Wrap multiple database operations in a transaction to ensure atomicity — all succeed or all roll back.

### Transaction Pattern

```typescript
// modules/orders/orders.service.ts
@Injectable()
export class OrdersService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async createOrder(userId: string, items: CreateOrderItemDto[]) {
    return this.db.transaction(async (tx) => {
      // 1. Create the order
      const [order] = await tx
        .insert(orders)
        .values({ userId, status: 'pending', total: '0' })
        .returning();

      // 2. Create order items and calculate total
      let total = 0;
      for (const item of items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product?.name ?? item.productId}`);
          // Transaction auto-rolls back on throw
        }

        // Decrement stock
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));

        // Create order item
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
        });

        total += parseFloat(product.price) * item.quantity;
      }

      // 3. Update order total
      const [completed] = await tx
        .update(orders)
        .set({ total: total.toFixed(2) })
        .where(eq(orders.id, order.id))
        .returning();

      return completed;
    });
  }
}
```

### Simple Transfer Example

```typescript
async transfer(fromAccountId: string, toAccountId: string, amount: number) {
  return this.db.transaction(async (tx) => {
    // Debit
    const [from] = await tx
      .update(accounts)
      .set({ balance: sql`${accounts.balance} - ${amount}` })
      .where(and(
        eq(accounts.id, fromAccountId),
        gte(accounts.balance, amount), // prevent overdraft
      ))
      .returning();

    if (!from) {
      throw new BadRequestException('Insufficient balance');
    }

    // Credit
    await tx
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.id, toAccountId));

    // Audit log
    await tx.insert(transfers).values({
      fromAccountId,
      toAccountId,
      amount: amount.toFixed(2),
    });

    return { success: true };
  });
}
```

### Rules

- Use `db.transaction(async (tx) => { ... })` — pass `tx` to all queries inside
- Throw an exception to trigger rollback — Drizzle catches and rolls back automatically
- Use `tx` (not `this.db`) for all operations inside the callback — using `db` bypasses the transaction
- Keep transactions short — don't include HTTP calls, file I/O, or slow operations
- Use `sql` template for atomic arithmetic (increment/decrement) instead of read-modify-write
