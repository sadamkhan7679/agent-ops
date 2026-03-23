---
title: When to Split Modules
tags: splitting, modules, refactoring, boundaries
---

## When to Split Modules

Modules grow over time. Recognize the signals and split before complexity becomes unmanageable.

### Split Signals

```text
Split a module when:
✓ More than 5 services in one module
✓ Circular dependencies between services in the same module
✓ Two distinct domain concepts share a module (e.g., Orders + Inventory)
✓ A controller has routes for unrelated resources
✓ Tests require mocking half the module to test one service
✓ Multiple teams need to modify the same module frequently
```

### Before: Monolith Module

```typescript
// BAD: commerce.module.ts — too many responsibilities
@Module({
  controllers: [
    OrdersController,
    PaymentsController,
    RefundsController,
    InvoicesController,
    ShippingController,
  ],
  providers: [
    OrdersService,
    PaymentsService,
    RefundsService,
    InvoicesService,
    ShippingService,
    OrdersRepository,
    PaymentsRepository,
  ],
})
export class CommerceModule {}
```

### After: Focused Modules

```typescript
// GOOD: orders.module.ts
@Module({
  imports: [PaymentsModule, ShippingModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}

// GOOD: payments.module.ts
@Module({
  controllers: [PaymentsController, RefundsController],
  providers: [PaymentsService, RefundsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}

// GOOD: shipping.module.ts
@Module({
  controllers: [ShippingController],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}

// GOOD: invoices.module.ts
@Module({
  imports: [OrdersModule, PaymentsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
```

### Communication After Split

```typescript
// Use events to decouple modules that were previously tightly coupled
// orders.service.ts
@Injectable()
export class OrdersService {
  constructor(
    private readonly repository: OrdersRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async complete(orderId: string): Promise<Order> {
    const order = await this.repository.update(orderId, { status: 'completed' });

    // Other modules react to events instead of being called directly
    this.eventEmitter.emit('order.completed', { orderId: order.id, total: order.total });

    return order;
  }
}

// invoices.service.ts — listens instead of being called
@Injectable()
export class InvoicesService {
  @OnEvent('order.completed')
  async generateInvoice(payload: { orderId: string; total: number }) {
    await this.create({ orderId: payload.orderId, amount: payload.total });
  }
}
```

### Rules

- One domain concept per module — if you can name two concepts, you need two modules
- Split by noun (Orders, Payments), not by verb (Creating, Processing)
- After splitting, communicate between modules via exported services or events
- Use events for one-to-many or fire-and-forget communication
- Use direct service imports for synchronous, required operations
- Keep the `exports` array minimal — only expose what other modules actually need
