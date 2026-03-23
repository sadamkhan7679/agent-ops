---
title: Feature Modules vs Domain Modules
tags: modules, features, domains, boundaries
---

## Feature Modules vs Domain Modules

NestJS documentation uses "feature module" for any non-root module. In practice, distinguish between **domain modules** (own a business entity) and **feature modules** (orchestrate a cross-cutting flow).

### Domain Modules

Own a single business entity and its CRUD operations:

```text
modules/
  users/          # Owns User entity
  products/       # Owns Product entity
  orders/         # Owns Order entity
  categories/     # Owns Category entity
```

Rules for domain modules:
- One primary entity per module
- Repository lives inside the module
- Service contains business rules for that entity
- Controller handles REST endpoints for that entity

### Feature Modules

Orchestrate a flow that spans multiple domain modules:

```text
modules/
  checkout/       # Orchestrates: orders + products + payments + notifications
  onboarding/     # Orchestrates: users + verification + welcome email
  reporting/      # Reads from: orders + products + users (read-only)
```

Rules for feature modules:
- Import services from domain modules (don't re-implement data access)
- Own the orchestration logic, not the entities
- May have their own controller for flow-specific endpoints
- Should not have their own repository (use domain module repositories via services)

### Example: Checkout Feature Module

```typescript
// modules/checkout/checkout.module.ts
@Module({
  imports: [OrdersModule, ProductsModule, PaymentsModule, NotificationsModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}

// modules/checkout/checkout.service.ts
@Injectable()
export class CheckoutService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly paymentsService: PaymentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async processCheckout(dto: CheckoutDto): Promise<Order> {
    // Validate stock
    await this.productsService.validateStock(dto.items);
    // Create order
    const order = await this.ordersService.create(dto);
    // Process payment
    await this.paymentsService.charge(order.id, order.total);
    // Send confirmation
    await this.notificationsService.sendOrderConfirmation(order);
    return order;
  }
}
```

### Decision Tree

```
Does this module own a database entity?
  Yes → Domain module (users/, products/, orders/)
  No  → Does it orchestrate multiple domains?
         Yes → Feature module (checkout/, onboarding/)
         No  → Is it infrastructure?
                Yes → Shared module (database/, mail/, logger/)
                No  → It probably belongs inside an existing module
```
