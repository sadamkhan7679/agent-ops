---
title: Bulk Operations
tags: rest, bulk, batch, operations
---

## Bulk Operations

Handle bulk create, update, and delete operations efficiently.

### Bulk Create

```typescript
// modules/products/products.controller.ts
@Controller('products')
export class ProductsController {
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreate(@Body() dto: BulkCreateProductsDto) {
    return this.productsService.bulkCreate(dto.items);
  }
}

// dto/bulk-create-products.dto.ts
export class BulkCreateProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(100) // prevent oversized batches
  @Type(() => CreateProductDto)
  items: CreateProductDto[];
}
```

### Bulk Service Implementation

```typescript
// modules/products/products.service.ts
@Injectable()
export class ProductsService {
  async bulkCreate(items: CreateProductDto[]) {
    return this.db.transaction(async (tx) => {
      const created = await tx
        .insert(products)
        .values(items.map((item) => ({
          name: item.name,
          price: item.price,
          categoryId: item.categoryId,
        })))
        .returning();

      return { data: created, count: created.length };
    });
  }

  async bulkUpdate(updates: BulkUpdateItem[]) {
    return this.db.transaction(async (tx) => {
      const results = await Promise.all(
        updates.map(({ id, ...data }) =>
          tx.update(products).set(data).where(eq(products.id, id)).returning(),
        ),
      );

      return { data: results.flat(), count: results.length };
    });
  }

  async bulkDelete(ids: string[]) {
    const deleted = await this.db
      .delete(products)
      .where(inArray(products.id, ids))
      .returning({ id: products.id });

    return { deletedCount: deleted.length };
  }
}
```

### Bulk Delete Endpoint

```typescript
@Controller('products')
export class ProductsController {
  // DELETE with body for bulk operations
  @Delete('bulk')
  bulkDelete(@Body() dto: BulkDeleteDto) {
    return this.productsService.bulkDelete(dto.ids);
  }
}

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(100)
  ids: string[];
}
```

### Rules

- Use `POST /resource/bulk` for bulk create — not `POST /resource` with an array body
- Wrap bulk mutations in a transaction — all succeed or all fail
- Set `@ArrayMaxSize()` on DTOs to prevent oversized payloads
- Use `@ValidateNested({ each: true })` with `@Type()` for array item validation
- Return the count of affected records alongside the data
- For very large batches (1000+), consider async processing with a job queue instead
