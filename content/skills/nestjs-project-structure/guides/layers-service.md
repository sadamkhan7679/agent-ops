---
title: Service Layer Patterns
tags: layers, service, business-logic, orchestration
---

## Service Layer Patterns

Services contain business logic: validation rules, authorization checks, orchestration of multiple repositories, and error handling.

### What belongs in services

- Business validation (beyond DTO validation)
- Authorization checks (does this user own this resource?)
- Orchestrating multiple repositories
- Event emission
- Error throwing (NotFoundException, ForbiddenException)
- DTO transformation (entity → response DTO)

### Example

```typescript
@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateOrderDto, actor: User): Promise<OrderResponseDto> {
    // Business validation
    const products = await this.productsRepository.findByIds(dto.productIds);
    const unavailable = products.filter((p) => p.stock < 1);
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Products out of stock: ${unavailable.map((p) => p.name).join(', ')}`,
      );
    }

    // Create order
    const order = await this.ordersRepository.create({
      userId: actor.id,
      items: dto.items,
      total: this.calculateTotal(products, dto.items),
    });

    // Side effects
    this.eventEmitter.emit('order.created', { orderId: order.id });

    return OrderResponseDto.fromEntity(order);
  }

  async findOneOrFail(id: string, actor: User): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    // Authorization: only owner or admin can view
    if (order.userId !== actor.id && actor.role !== 'admin') {
      throw new ForbiddenException();
    }

    return OrderResponseDto.fromEntity(order);
  }

  private calculateTotal(products: Product[], items: OrderItem[]): number {
    return items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)!;
      return sum + product.price * item.quantity;
    }, 0);
  }
}
```

Rules:
- One service per domain module
- Services call repositories, never the database directly
- Services throw HTTP exceptions (NestJS catches and formats them)
- Keep private helpers for calculation logic
- Use events for cross-module side effects
