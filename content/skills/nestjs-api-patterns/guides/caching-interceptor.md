---
title: Response Caching Interceptor
tags: caching, interceptor, cache-manager, http-cache
---

## Response Caching Interceptor

Cache API responses to reduce database load and improve response times.

### Built-in Cache Interceptor

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 60_000,      // default 60 seconds
      max: 1000,         // max items in memory cache
    }),
  ],
})
export class AppModule {}
```

```typescript
// modules/products/products.controller.ts
import { CacheInterceptor, CacheTTL, CacheKey } from '@nestjs/cache-manager';

@Controller('products')
@UseInterceptors(CacheInterceptor) // cache all GET routes in this controller
export class ProductsController {
  @Get()
  @CacheTTL(30_000) // override: 30 seconds for listings
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @CacheTTL(120_000) // 2 minutes for single product
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    // Cache is automatically bypassed for non-GET requests
    return product;
  }
}
```

### Custom Cache Interceptor

```typescript
// common/interceptors/custom-cache.interceptor.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class HttpCacheInterceptor extends CacheInterceptor {
  // Include query params in cache key
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();

    // Don't cache authenticated requests by default
    if (request.user) {
      return undefined;
    }

    // Cache key = URL + query string
    return request.url;
  }
}
```

### Manual Cache Management

```typescript
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class ProductsService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async findById(id: string) {
    const cacheKey = `product:${id}`;

    // Check cache
    const cached = await this.cache.get<Product>(cacheKey);
    if (cached) return cached;

    // Fetch and cache
    const product = await this.productsRepo.findById(id);
    if (product) {
      await this.cache.set(cacheKey, product, 120_000);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const updated = await this.productsRepo.update(id, dto);
    // Invalidate cache on mutation
    await this.cache.del(`product:${id}`);
    return updated;
  }
}
```

### Rules

- Use `@UseInterceptors(CacheInterceptor)` for simple GET endpoint caching
- Override `trackBy` to include query params and exclude authenticated requests
- Invalidate cache on mutations (create, update, delete) — stale data is worse than no cache
- Use `CacheModule.register()` for in-memory caching, `CacheModule.registerAsync()` with Redis for distributed
- Set reasonable TTLs: listings (30s), individual records (2-5min), static reference data (30min)
- Don't cache user-specific or personalized responses with the built-in interceptor
