---
title: Module Dependency Rules
tags: architecture, dependencies, circular, imports
---

## Module Dependency Rules

Module dependencies should flow in one direction: feature modules depend on shared modules, never the reverse. Circular dependencies are the #1 architecture smell in NestJS.

### Dependency Direction

```text
                    AppModule
                   /    |    \
                  v     v     v
            UsersModule  OrdersModule  AuthModule
                  \     |     /
                   v    v    v
              SharedModule (Database, Mail, Logger)
                      |
                      v
                 ConfigModule
```

**Rules:**

- Feature modules import shared modules, never other feature modules directly
- Shared modules never import feature modules
- If two feature modules need to communicate, use events or a shared service

### Preventing Circular Dependencies

**Incorrect (circular import):**

```typescript
// users.module.ts
@Module({
  imports: [OrdersModule], // Users depends on Orders
})
export class UsersModule {}

// orders.module.ts
@Module({
  imports: [UsersModule], // Orders depends on Users — CIRCULAR
})
export class OrdersModule {}
```

**Correct (use forwardRef or extract shared logic):**

```typescript
// Option 1: Extract shared logic into a new module
// shared/user-orders/user-orders.service.ts
@Injectable()
export class UserOrdersService {
  constructor(
    @Inject(forwardRef(() => UsersService)) private users: UsersService,
    @Inject(forwardRef(() => OrdersService)) private orders: OrdersService,
  ) {}
}

// Option 2: Use events for loose coupling
// orders.service.ts
@Injectable()
export class OrdersService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createOrder(dto: CreateOrderDto) {
    const order = await this.repository.create(dto);
    this.eventEmitter.emit('order.created', { orderId: order.id, userId: dto.userId });
    return order;
  }
}

// users.service.ts — listens without importing OrdersModule
@Injectable()
export class UsersService {
  @OnEvent('order.created')
  async handleOrderCreated(payload: { orderId: string; userId: string }) {
    await this.repository.incrementOrderCount(payload.userId);
  }
}
```

### Module Export Rules

```typescript
// Only export what other modules need
@Module({
  providers: [UsersService, UsersRepository, UsersCacheService],
  exports: [UsersService], // Only the service — not internal implementation
})
export class UsersModule {}
```

Rules:

- Export the minimum public API from each module
- Keep repositories, strategies, and internal services private
- Use `@nestjs/event-emitter` for cross-module communication
- Use `forwardRef()` only as a last resort — prefer extracting shared logic
