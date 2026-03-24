---
title: RESTful Resource Naming
tags: rest, naming, routes, controllers
---

## RESTful Resource Naming

Consistent resource naming makes APIs predictable and self-documenting.

### Standard CRUD Routes

```typescript
// modules/users/users.controller.ts
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
```

### Nested Resources

```typescript
// modules/posts/comments.controller.ts
@Controller('posts/:postId/comments')
export class CommentsController {
  @Get()
  findAll(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Post()
  create(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(postId, dto);
  }
}

// Only nest one level deep. For deeper access, use top-level:
// GET /comments/:commentId       ← direct access
// GET /posts/:postId/comments    ← scoped listing
```

### Action Endpoints

```typescript
// Non-CRUD actions use verbs as sub-resources
@Controller('orders')
export class OrdersController {
  @Post(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id);
  }

  @Post(':id/ship')
  ship(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ShipOrderDto) {
    return this.ordersService.ship(id, dto);
  }

  @Post('bulk-import')
  bulkImport(@Body() dto: BulkImportDto) {
    return this.ordersService.bulkImport(dto);
  }
}
```

### Rules

- Use plural nouns for resource names: `/users`, `/posts`, `/orders`
- Use kebab-case for multi-word resources: `/order-items`, `/payment-methods`
- Nest routes maximum one level deep: `/posts/:postId/comments`
- Use `PATCH` for partial updates, `PUT` for full replacement (prefer `PATCH`)
- Use `POST` for actions that don't map to CRUD: `/orders/:id/cancel`
- Always validate path params with `ParseUUIDPipe` or `ParseIntPipe`
- Return `204 No Content` for successful deletes
