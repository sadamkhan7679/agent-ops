---
title: Redis Caching
tags: caching, redis, distributed, cache-manager
---

## Redis Caching

Use Redis for distributed caching across multiple application instances.

### Setup

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('redis.host'),
            port: config.get('redis.port'),
          },
          password: config.get('redis.password'),
          ttl: 60_000,
        }),
      }),
    }),
  ],
})
export class AppModule {}
```

### Cache-Aside Pattern

```typescript
@Injectable()
export class ProductCacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly productsRepo: ProductsRepository,
  ) {}

  private key(id: string) {
    return `products:${id}`;
  }

  private listKey(params: string) {
    return `products:list:${params}`;
  }

  async findById(id: string): Promise<Product | null> {
    const cached = await this.cache.get<Product>(this.key(id));
    if (cached) return cached;

    const product = await this.productsRepo.findById(id);
    if (product) {
      await this.cache.set(this.key(id), product, 300_000); // 5 min
    }
    return product;
  }

  async invalidate(id: string) {
    await this.cache.del(this.key(id));
  }

  async invalidateList() {
    // Use Redis SCAN to find and delete list keys
    const store = this.cache.store as any;
    if (store.keys) {
      const keys = await store.keys('products:list:*');
      if (keys.length) {
        await Promise.all(keys.map((k: string) => this.cache.del(k)));
      }
    }
  }
}
```

### Cache Decorator Pattern

```typescript
// common/decorators/cacheable.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_OPTIONS_KEY = 'cache_options';

export interface CacheOptions {
  key: string;
  ttl?: number;
}

export const Cacheable = (options: CacheOptions) =>
  SetMetadata(CACHE_OPTIONS_KEY, options);

// Usage
@Injectable()
export class ProductsService {
  @Cacheable({ key: 'products:featured', ttl: 300_000 })
  async getFeaturedProducts() {
    return this.productsRepo.findFeatured();
  }
}
```

### Rules

- Use `cache-manager-redis-yet` for Redis integration with `@nestjs/cache-manager`
- Use key prefixes with colons for namespace organization: `products:${id}`, `users:${id}`
- Invalidate individual keys on mutations, pattern-based invalidation for lists
- Set TTLs appropriate to data volatility — frequently changing data gets shorter TTLs
- Use Redis for multi-instance deployments — in-memory cache only works for single instances
- Consider Redis Cluster for high-availability production deployments
