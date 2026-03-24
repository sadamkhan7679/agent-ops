---
title: Cache Invalidation Strategies
tags: caching, invalidation, events, patterns
---

## Cache Invalidation Strategies

Reliable cache invalidation prevents stale data while maintaining cache benefits.

### Event-Based Invalidation

```typescript
// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  constructor(
    private readonly repo: ProductsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.repo.update(id, dto);
    this.eventEmitter.emit('product.updated', { productId: id });
    return updated;
  }

  async delete(id: string) {
    await this.repo.delete(id);
    this.eventEmitter.emit('product.deleted', { productId: id });
  }
}

// common/listeners/cache-invalidation.listener.ts
@Injectable()
export class CacheInvalidationListener {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  @OnEvent('product.updated')
  @OnEvent('product.deleted')
  async onProductChange(payload: { productId: string }) {
    await this.cache.del(`products:${payload.productId}`);
    await this.cache.del('products:featured');
    // Invalidate any list caches that might contain this product
  }

  @OnEvent('order.completed')
  async onOrderCompleted(payload: { productIds: string[] }) {
    // Invalidate stock-related caches
    await Promise.all(
      payload.productIds.map((id) => this.cache.del(`products:${id}`)),
    );
  }
}
```

### Write-Through Pattern

```typescript
@Injectable()
export class ProductsCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly repo: ProductsRepository,
  ) {}

  // Write-through: update DB and cache atomically
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const updated = await this.repo.update(id, dto);

    if (updated) {
      // Update cache with fresh data instead of just invalidating
      await this.cache.set(`products:${id}`, updated, 300_000);
    }

    return updated;
  }

  // Read-through: check cache first, populate on miss
  async findById(id: string): Promise<Product | null> {
    const cached = await this.cache.get<Product>(`products:${id}`);
    if (cached) return cached;

    const product = await this.repo.findById(id);
    if (product) {
      await this.cache.set(`products:${id}`, product, 300_000);
    }
    return product;
  }
}
```

### TTL-Based Expiry for Listings

```typescript
// For data that's acceptable to be slightly stale
@Injectable()
export class DashboardService {
  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const stats = await this.computeExpensiveStats();
    await this.cache.set(cacheKey, stats, 60_000); // refresh every minute
    return stats;
  }
}
```

### Rules

- Use event-based invalidation for data that must be fresh after mutations
- Use TTL-based expiry for data that can tolerate brief staleness (dashboards, analytics)
- Write-through caching updates the cache alongside the DB — no window of stale data
- Centralize invalidation logic in event listeners — don't scatter `cache.del` across services
- Always have a TTL even with event-based invalidation — safety net against missed events
- Invalidate aggressively — a cache miss is cheap, serving stale data causes bugs
