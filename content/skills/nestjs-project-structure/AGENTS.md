# Nestjs Project Structure — Compiled Guide

**Version:** 1.0.0

> This file is auto-generated from the individual guide files in `guides/`. Do not edit directly.

## Overview

Opinionated NestJS + TypeScript project structure covering module organization, layer-first architecture, monorepo patterns, and domain-driven folder conventions. Use when organizing a NestJS codebase, deciding where files should live, splitting large modules, or structuring services, controllers, repositories, DTOs, and guards.

## Table of Contents

1. [Architecture Principles: Module Dependency Rules](#1-module-dependency-rules)
2. [Architecture Principles: Module-First Architecture](#2-module-first-architecture)
3. [Module Organization: Domain Module Structure](#3-domain-module-structure)
4. [Module Organization: Dynamic Modules](#4-dynamic-modules)
5. [Module Organization: Feature Modules vs Domain Modules](#5-feature-modules-vs-domain-modules)
6. [Layer Separation: Controller Layer Boundaries](#6-controller-layer-boundaries)
7. [Layer Separation: Repository Pattern for Data Access](#7-repository-pattern-for-data-access)
8. [Layer Separation: Service Layer Patterns](#8-service-layer-patterns)
9. [Shared & Common: Common Module for Cross-Cutting Concerns](#9-common-module-for-cross-cutting-concerns)
10. [Shared & Common: Shared Infrastructure Modules](#10-shared-infrastructure-modules)
11. [DTOs & Validation: DTO Organization and Validation](#11-dto-organization-and-validation)
12. [DTOs & Validation: DTO Transformation and Serialization](#12-dto-transformation-and-serialization)
13. [Configuration: Environment-Specific Configuration](#13-environment-specific-configuration)
14. [Configuration: Typed Configuration Module](#14-typed-configuration-module)
15. [Naming Conventions: Class and Decorator Naming](#15-class-and-decorator-naming)
16. [Naming Conventions: File Naming Conventions](#16-file-naming-conventions)
17. [Monorepo Patterns: Nx Monorepo Structure](#17-nx-monorepo-structure)
18. [Monorepo Patterns: Turborepo Monorepo Structure](#18-turborepo-monorepo-structure)
19. [Testing Structure: E2E Test Organization](#19-e2e-test-organization)
20. [Testing Structure: Unit Test File Organization](#20-unit-test-file-organization)
21. [Splitting Guidelines: When to Split Modules](#21-when-to-split-modules)
22. [Splitting Guidelines: When to Split Services](#22-when-to-split-services)

---

## 1. Module Dependency Rules

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

---

## 2. Module-First Architecture

NestJS modules are the natural boundary for domain ownership. Each module encapsulates its controllers, services, repositories, DTOs, and entities. Inside each module, separate code by layer (controller → service → repository).

### Recommended Structure

```text
src/
  app.module.ts               # Root module — imports all feature modules
  main.ts                     # Bootstrap
  common/                     # Cross-cutting (guards, filters, pipes, interceptors)
    decorators/
      current-user.decorator.ts
      roles.decorator.ts
    filters/
      all-exceptions.filter.ts
    guards/
      jwt-auth.guard.ts
      roles.guard.ts
    interceptors/
      logging.interceptor.ts
      transform.interceptor.ts
    pipes/
      parse-uuid.pipe.ts
  config/                     # Typed configuration
    config.module.ts
    app.config.ts
    database.config.ts
    auth.config.ts
  modules/                    # Domain modules
    users/
      users.module.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      dto/
        create-user.dto.ts
        update-user.dto.ts
        user-response.dto.ts
      entities/
        user.entity.ts
      users.controller.spec.ts
      users.service.spec.ts
    orders/
      orders.module.ts
      orders.controller.ts
      orders.service.ts
      orders.repository.ts
      dto/
      entities/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
      strategies/
        jwt.strategy.ts
        local.strategy.ts
  shared/                     # Infrastructure modules
    database/
      database.module.ts
      drizzle.provider.ts
      schema/                 # Drizzle schema files
        users.schema.ts
        orders.schema.ts
        index.ts
    mail/
      mail.module.ts
      mail.service.ts
    logger/
      logger.module.ts
      logger.service.ts
  lib/                        # Pure utilities (no NestJS dependencies)
    pagination/
      paginate.ts
    crypto/
      hash.ts
    dates/
      format.ts
test/
  e2e/
    app.e2e-spec.ts
    auth.e2e-spec.ts
```

### Why Module-First

```text
# BAD: Layer-first at top level — modules hidden inside layers
src/
  controllers/
    users.controller.ts
    orders.controller.ts
  services/
    users.service.ts
    orders.service.ts
  repositories/
    users.repository.ts
```

Problems:
- Related files scattered across folders
- No clear ownership boundaries
- Hard to extract a module into a separate package
- NestJS module system ignored

Module-first keeps **all related code together** while maintaining layer separation **inside** each module.

---

## 3. Domain Module Structure

Every domain module follows the same internal structure: module definition, controller, service, repository, DTOs, and entities.

### Standard Module Layout

```text
modules/users/
  users.module.ts           # Module definition with imports/providers/exports
  users.controller.ts       # HTTP layer — routes, params, response codes
  users.service.ts          # Business logic — validation, orchestration
  users.repository.ts       # Data access — Drizzle queries
  dto/
    create-user.dto.ts      # Request validation
    update-user.dto.ts
    user-response.dto.ts    # Response serialization
    user-query.dto.ts       # Query params validation
  entities/
    user.entity.ts          # Domain entity (if different from schema)
  users.controller.spec.ts  # Controller unit tests
  users.service.spec.ts     # Service unit tests
```

### Module Definition

```typescript
// users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { DatabaseModule } from '@/shared/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService], // Only export what other modules need
})
export class UsersModule {}
```

### Layer Flow

```text
Request → Controller → Service → Repository → Database
                         ↓
                     Validation
                     Authorization
                     Business rules
```

- **Controller**: HTTP concerns only — parsing params, calling service, returning response
- **Service**: Business logic — validation, authorization checks, orchestrating multiple repositories
- **Repository**: Data access only — Drizzle queries, no business logic

```typescript
// Controller — thin, delegates to service
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOneOrFail(id);
  }
}

// Service — business logic
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOneOrFail(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return UserResponseDto.fromEntity(user);
  }
}

// Repository — data access
@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findById(id: string) {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }
}
```

---

## 4. Dynamic Modules

Dynamic modules accept configuration at import time, enabling reusable modules with different settings per consumer.

### Implementation

```typescript
// shared/mail/mail.module.ts
import { Module, type DynamicModule } from '@nestjs/common';
import { MailService } from './mail.service';

interface MailModuleOptions {
  apiKey: string;
  from: string;
  templateDir?: string;
}

@Module({})
export class MailModule {
  static forRoot(options: MailModuleOptions): DynamicModule {
    return {
      module: MailModule,
      global: true, // Available everywhere without importing
      providers: [
        { provide: 'MAIL_OPTIONS', useValue: options },
        MailService,
      ],
      exports: [MailService],
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => MailModuleOptions | Promise<MailModuleOptions>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: MailModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: 'MAIL_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        MailService,
      ],
      exports: [MailService],
    };
  }
}

// Usage in AppModule
@Module({
  imports: [
    ConfigModule.forRoot(),
    MailModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.get('MAIL_API_KEY'),
        from: config.get('MAIL_FROM'),
      }),
    }),
  ],
})
export class AppModule {}
```

Rules:
- Use `forRoot()` for synchronous configuration
- Use `forRootAsync()` when configuration depends on other modules (ConfigModule)
- Set `global: true` for infrastructure modules used everywhere (database, mail, logger)
- Keep `forRoot` and `forRootAsync` as the only two static methods

---

## 5. Feature Modules vs Domain Modules

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

---

## 6. Controller Layer Boundaries

Controllers handle HTTP concerns only: routing, request parsing, response formatting, and status codes. No business logic.

### What belongs in controllers

- Route definitions (`@Get`, `@Post`, `@Put`, `@Delete`)
- Parameter extraction (`@Param`, `@Query`, `@Body`)
- Response status codes (`@HttpCode`)
- OpenAPI decorators (`@ApiTags`, `@ApiResponse`)
- Calling the service and returning the result

### What does NOT belong in controllers

- Database queries
- Business validation rules
- Authorization logic (use guards)
- Error message formatting (use exception filters)
- Data transformation (use interceptors or DTOs)

### Example

```typescript
@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users with pagination' })
  async findAll(@Query() query: UserQueryDto): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return this.usersService.findOneOrFail(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: User): Promise<UserResponseDto> {
    return this.usersService.create(dto, actor);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
```

Each method is 1-3 lines: extract params, call service, return. If a controller method is more than 5 lines, logic probably belongs in the service.

---

## 7. Repository Pattern for Data Access

Repositories abstract database queries behind a typed interface. Services never write raw queries — they call repository methods.

### Base Repository Pattern

```typescript
// shared/database/base.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from './drizzle.provider';
import { eq, type SQL } from 'drizzle-orm';
import { type PgTable } from 'drizzle-orm/pg-core';

@Injectable()
export abstract class BaseRepository<TTable extends PgTable, TInsert, TSelect> {
  constructor(@Inject(DRIZZLE) protected readonly db: DrizzleDB) {}

  protected abstract table: TTable;

  async findById(id: string): Promise<TSelect | undefined> {
    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq((this.table as any).id, id))
      .limit(1);
    return result as TSelect | undefined;
  }

  async create(data: TInsert): Promise<TSelect> {
    const [result] = await this.db.insert(this.table).values(data as any).returning();
    return result as TSelect;
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect | undefined> {
    const [result] = await this.db
      .update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning();
    return result as TSelect | undefined;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(this.table).where(eq((this.table as any).id, id));
  }
}
```

### Domain Repository

```typescript
// modules/users/users.repository.ts
@Injectable()
export class UsersRepository extends BaseRepository<
  typeof users,
  typeof users.$inferInsert,
  typeof users.$inferSelect
> {
  protected table = users;

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  async findWithOrders(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: { orders: { limit: 10, orderBy: desc(orders.createdAt) } },
    });
  }

  async search(query: UserQueryDto) {
    const conditions: SQL[] = [];
    if (query.name) conditions.push(ilike(users.name, `%${query.name}%`));
    if (query.role) conditions.push(eq(users.role, query.role));

    return this.db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt))
      .limit(query.limit)
      .offset(query.offset);
  }
}
```

Rules:
- One repository per domain entity
- Repositories return raw data (entities), not DTOs
- Complex joins and aggregations live in the repository
- Business logic (authorization, validation) stays in the service
- Use the base repository for common CRUD, extend for domain-specific queries

---

## 8. Service Layer Patterns

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

---

## 9. Common Module for Cross-Cutting Concerns

The `common/` directory holds cross-cutting decorators, guards, interceptors, pipes, and filters that are used globally or across multiple modules.

### Structure

```text
common/
  decorators/
    current-user.decorator.ts    # Extract user from request
    roles.decorator.ts           # @Roles('admin', 'user')
    public.decorator.ts          # @Public() to skip auth
    api-paginated.decorator.ts   # Swagger pagination docs
  filters/
    all-exceptions.filter.ts     # Global exception handler
    validation.filter.ts         # Transform validation errors
  guards/
    jwt-auth.guard.ts            # JWT authentication
    roles.guard.ts               # Role-based authorization
  interceptors/
    logging.interceptor.ts       # Request/response logging
    transform.interceptor.ts     # Response envelope wrapping
    timeout.interceptor.ts       # Request timeout
  pipes/
    parse-uuid.pipe.ts           # UUID validation
    trim-strings.pipe.ts         # Trim whitespace from strings
  constants/
    injection-tokens.ts          # DI token constants
```

### Global Registration

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  await app.listen(3000);
}
```

### Custom Decorator Example

```typescript
// common/decorators/current-user.decorator.ts
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage: @CurrentUser() user: User
// Usage: @CurrentUser('id') userId: string
```

Rules:
- `common/` is NOT a NestJS module — just a directory for shared providers
- Register global providers in `main.ts` or via `APP_GUARD`/`APP_INTERCEPTOR` tokens
- Keep each file focused on one concern
- Decorators, pipes, and filters here should be truly generic — domain-specific ones stay in their module

---

## 10. Shared Infrastructure Modules

Shared modules provide infrastructure services (database, mail, logger) that multiple domain modules depend on.

### Structure

```text
shared/
  database/
    database.module.ts          # Drizzle + connection pool setup
    drizzle.provider.ts         # DRIZZLE injection token
    schema/
      users.schema.ts
      orders.schema.ts
      products.schema.ts
      relations.ts              # All relation definitions
      index.ts                  # Re-exports all schemas
  mail/
    mail.module.ts
    mail.service.ts
    templates/
      welcome.hbs
      reset-password.hbs
  logger/
    logger.module.ts
    logger.service.ts
  cache/
    cache.module.ts
    cache.service.ts
```

### Database Module Example

```typescript
// shared/database/drizzle.provider.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const drizzleProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.get('DATABASE_URL'),
      max: 20,
    });
    return drizzle(pool, { schema });
  },
};

// shared/database/database.module.ts
@Global()
@Module({
  providers: [drizzleProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
```

Rules:
- Mark infrastructure modules as `@Global()` when used by most modules
- Keep Drizzle schema files in `shared/database/schema/` — one per table
- Export a barrel file (`schema/index.ts`) for clean imports
- Shared modules own their configuration but get values from ConfigModule

---

## 11. DTO Organization and Validation

DTOs validate input and shape output. Separate request DTOs (validation) from response DTOs (serialization) to prevent leaking internal fields.

### File Placement

```text
modules/users/dto/
  create-user.dto.ts        # POST body validation
  update-user.dto.ts        # PATCH body (partial of create)
  user-query.dto.ts         # GET query params
  user-response.dto.ts      # Response serialization
```

### Request DTO

```typescript
// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ enum: ['user', 'admin'] })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: 'user' | 'admin';
}
```

### Update DTO (Partial)

```typescript
// dto/update-user.dto.ts
import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// All fields optional, email excluded from updates
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email'])) {}
```

### Response DTO

```typescript
// dto/user-response.dto.ts
import { Exclude, Expose } from 'class-transformer';

export class UserResponseDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() name: string;
  @Expose() role: string;
  @Expose() createdAt: Date;

  @Exclude() password: never;   // Never exposed
  @Exclude() deletedAt: never;

  static fromEntity(entity: UserEntity): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = entity.id;
    dto.email = entity.email;
    dto.name = entity.name;
    dto.role = entity.role;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
```

Rules:
- One DTO per operation (create, update, query, response)
- Use `PartialType` and `OmitType` to derive update DTOs
- Never reuse request DTOs as response DTOs
- Response DTOs must explicitly exclude sensitive fields
- Place DTOs in `dto/` within the module, not in a global `dtos/` folder

---

## 12. DTO Transformation and Serialization

class-transformer converts plain objects to class instances (request) and class instances to plain objects (response). Use it with interceptors for consistent serialization.

### Serialization Interceptor

```typescript
// common/interceptors/transform.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';

interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has envelope structure, pass through
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }
        return { data };
      }),
    );
  }
}
```

### Query DTO with Transformation

```typescript
// dto/user-query.dto.ts
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @IsOptional()
  @Type(() => Number)   // Transform string query param to number
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  get offset(): number {
    return ((this.page ?? 1) - 1) * (this.limit ?? 20);
  }
}
```

### Date Transformation

```typescript
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
```

Rules:
- Enable `transform: true` and `enableImplicitConversion: true` in global ValidationPipe
- Use `@Type(() => Number)` for query params that arrive as strings
- Use `@Type(() => Date)` for date strings
- Keep transformation logic in DTOs, not in controllers or services

---

## 13. Environment-Specific Configuration

Separate environment files prevent accidental production deployments with development settings.

### Environment Files

```text
.env                # Default values (committed, no secrets)
.env.local          # Local overrides (gitignored)
.env.test           # Test environment
.env.production     # Production values reference (no actual secrets)
```

### Validation at Startup

```typescript
// config/app.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(',').map((o) => o.trim()))
    .default('http://localhost:3000'),
  API_PREFIX: z.string().default('api'),
});

export const appConfig = registerAs('app', () => {
  const env = schema.parse(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigins: env.CORS_ORIGINS,
    apiPrefix: env.API_PREFIX,
    isDev: env.NODE_ENV === 'development',
    isProd: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
  };
});
```

### Environment-Specific Behavior

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const appConf = config.get('app');

  // Swagger only in development
  if (appConf.isDev) {
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  // CORS
  app.enableCors({ origin: appConf.corsOrigins });

  app.setGlobalPrefix(appConf.apiPrefix);
  await app.listen(appConf.port);
}
```

Rules:
- Validate ALL environment variables at startup with Zod
- Crash immediately if required variables are missing — don't discover at runtime
- Use `.default()` for optional values with sensible defaults
- Never commit secrets — use `.env.local` (gitignored) or environment injection

---

## 14. Typed Configuration Module

Use `@nestjs/config` with typed factory functions for type-safe, validated configuration.

### Structure

```text
config/
  config.module.ts          # ConfigModule.forRoot setup
  app.config.ts             # App-wide config (port, cors, name)
  database.config.ts        # Database connection config
  auth.config.ts            # JWT secrets, token expiry
  mail.config.ts            # SMTP/API config
```

### Typed Config Factory

```typescript
// config/database.config.ts
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MAX: z.coerce.number().default(20),
  DATABASE_SSL: z.coerce.boolean().default(false),
});

export const databaseConfig = registerAs('database', () => {
  const env = schema.parse(process.env);
  return {
    url: env.DATABASE_URL,
    poolMax: env.DATABASE_POOL_MAX,
    ssl: env.DATABASE_SSL,
  };
});

export type DatabaseConfig = ReturnType<typeof databaseConfig>;
```

### Config Module Setup

```typescript
// config/config.module.ts
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';

export const ConfigModule = NestConfigModule.forRoot({
  isGlobal: true,
  load: [appConfig, databaseConfig, authConfig],
  envFilePath: ['.env.local', '.env'],
});
```

### Usage with Type Safety

```typescript
@Injectable()
export class AuthService {
  constructor(
    @Inject(authConfig.KEY) private readonly config: AuthConfig,
  ) {}

  generateToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.config.jwtSecret,
        expiresIn: this.config.jwtExpiresIn,
      },
    );
  }
}
```

Rules:
- Validate environment variables with Zod at startup — fail fast on missing config
- Use `registerAs` for namespaced, typed configuration
- Set `isGlobal: true` to avoid importing ConfigModule in every feature module
- Never access `process.env` directly in services — always go through ConfigService or typed config

---

## 15. Class and Decorator Naming

Class names follow PascalCase with the same suffix convention as file names.

### Standard Patterns

```typescript
// Module
export class UsersModule {}

// Controller
@Controller('users')
export class UsersController {}

// Service
@Injectable()
export class UsersService {}

// Repository
@Injectable()
export class UsersRepository {}

// Guard
@Injectable()
export class JwtAuthGuard implements CanActivate {}

// Interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {}

// Pipe
@Injectable()
export class ParseUUIDPipe implements PipeTransform {}

// Filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {}

// DTO
export class CreateUserDto {}
export class UpdateUserDto {}
export class UserResponseDto {}
export class UserQueryDto {}

// Entity
export class UserEntity {}

// Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {}

// Provider token
export const DRIZZLE = Symbol('DRIZZLE');

// Custom decorator (function, not class)
export const CurrentUser = createParamDecorator(...);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
export const Public = () => SetMetadata('isPublic', true);
```

### Rules

- Class name = PascalCase version of file name
- `UsersService` in `users.service.ts`
- `JwtAuthGuard` in `jwt-auth.guard.ts`
- DTOs include the operation: `Create`, `Update`, `Query`, `Response`
- Custom decorators are functions, not classes — use camelCase
- Injection tokens use UPPER_SNAKE_CASE Symbols

---

## 16. File Naming Conventions

NestJS enforces a suffix convention for generated files. Follow it consistently for all files.

### Standard Suffixes

| Suffix | Purpose | Example |
|--------|---------|---------|
| `.module.ts` | Module definition | `users.module.ts` |
| `.controller.ts` | HTTP controller | `users.controller.ts` |
| `.service.ts` | Business logic | `users.service.ts` |
| `.repository.ts` | Data access | `users.repository.ts` |
| `.guard.ts` | Route guard | `jwt-auth.guard.ts` |
| `.interceptor.ts` | Request/response interceptor | `logging.interceptor.ts` |
| `.pipe.ts` | Validation/transformation pipe | `parse-uuid.pipe.ts` |
| `.filter.ts` | Exception filter | `all-exceptions.filter.ts` |
| `.decorator.ts` | Custom decorator | `current-user.decorator.ts` |
| `.strategy.ts` | Passport strategy | `jwt.strategy.ts` |
| `.dto.ts` | Data transfer object | `create-user.dto.ts` |
| `.entity.ts` | Domain entity | `user.entity.ts` |
| `.schema.ts` | Drizzle schema | `users.schema.ts` |
| `.spec.ts` | Unit test | `users.service.spec.ts` |
| `.e2e-spec.ts` | E2E test | `auth.e2e-spec.ts` |
| `.config.ts` | Configuration | `database.config.ts` |
| `.provider.ts` | Custom provider | `drizzle.provider.ts` |
| `.interface.ts` | TypeScript interface | `pagination.interface.ts` |

### Naming Rules

- **kebab-case** for all file names: `jwt-auth.guard.ts`, not `JwtAuthGuard.ts`
- **Singular noun** for entity-related files: `user.entity.ts`, not `users.entity.ts`
- **Plural noun** for module-level files: `users.module.ts`, `users.controller.ts`
- **Action prefix** for DTOs: `create-user.dto.ts`, `update-user.dto.ts`
- **Descriptive name** for guards/interceptors: `jwt-auth.guard.ts`, `logging.interceptor.ts`

### Anti-Patterns

```text
# BAD: PascalCase file names
UsersController.ts
JwtAuthGuard.ts

# BAD: Missing suffix
users.ts          # What is this? Service? Controller?
auth.ts

# BAD: Generic names
helpers.ts
utils.ts
common.ts
```

---

## 17. Nx Monorepo Structure

Nx provides integrated monorepo tooling with dependency graph analysis, affected commands, and code generators.

### Workspace Layout

```text
my-workspace/
  apps/
    api/                    # NestJS application
      src/
        app/
          app.module.ts
        main.ts
      project.json
    web/                    # Frontend application
      src/
      project.json
  libs/
    shared/
      interfaces/           # Shared TypeScript interfaces
        src/
          lib/
            user.interface.ts
            pagination.interface.ts
          index.ts
        project.json
      utils/                # Shared utility functions
        src/
        project.json
    api/
      feature-users/        # Domain feature library
        src/
          lib/
            users.module.ts
            users.controller.ts
            users.service.ts
            users.repository.ts
            dto/
            entities/
          index.ts
        project.json
      data-access-db/       # Database access library
        src/
          lib/
            database.module.ts
            drizzle.provider.ts
          index.ts
        project.json
  nx.json
  tsconfig.base.json
```

### Library Types

```text
# Nx library classification for NestJS
feature-*     → Domain modules with controllers and services
data-access-* → Database, HTTP clients, external service integrations
util-*        → Pure functions, helpers, no NestJS dependencies
shared-*      → Cross-app interfaces, DTOs, constants
```

### Generating Libraries

```bash
# Feature library
pnpm nx g @nx/nest:library feature-users --directory=libs/api/feature-users

# Shared interfaces
pnpm nx g @nx/js:library interfaces --directory=libs/shared/interfaces

# Data access library
pnpm nx g @nx/nest:library data-access-db --directory=libs/api/data-access-db
```

### Importing Across Libraries

```typescript
// tsconfig.base.json paths
{
  "compilerOptions": {
    "paths": {
      "@my-workspace/shared/interfaces": ["libs/shared/interfaces/src/index.ts"],
      "@my-workspace/api/feature-users": ["libs/api/feature-users/src/index.ts"],
      "@my-workspace/api/data-access-db": ["libs/api/data-access-db/src/index.ts"]
    }
  }
}

// Usage in app
import { UsersModule } from '@my-workspace/api/feature-users';
import { DatabaseModule } from '@my-workspace/api/data-access-db';
import { User } from '@my-workspace/shared/interfaces';
```

### Enforcing Boundaries

```json
// nx.json — project tags
// In each project.json, add tags:
// apps/api: ["scope:api", "type:app"]
// libs/api/feature-users: ["scope:api", "type:feature"]
// libs/shared/interfaces: ["scope:shared", "type:interfaces"]
```

```json
// .eslintrc.json — boundary rules
{
  "rules": {
    "@nx/enforce-module-boundaries": [
      "error",
      {
        "depConstraints": [
          { "sourceTag": "type:app", "onlyDependOnLibsWithTags": ["type:feature", "type:data-access", "type:util", "type:interfaces"] },
          { "sourceTag": "type:feature", "onlyDependOnLibsWithTags": ["type:data-access", "type:util", "type:interfaces"] },
          { "sourceTag": "type:data-access", "onlyDependOnLibsWithTags": ["type:util", "type:interfaces"] },
          { "sourceTag": "type:util", "onlyDependOnLibsWithTags": ["type:interfaces"] }
        ]
      }
    ]
  }
}
```

### Rules

- Use `feature-*` libraries for domain modules — keep `apps/api` thin (just AppModule imports)
- Enforce dependency direction: app → feature → data-access → util → interfaces
- Use `pnpm nx affected` for CI — only build/test what changed
- Barrel exports (`index.ts`) define the public API of each library — never import from internal paths

---

## 18. Turborepo Monorepo Structure

Turborepo uses pnpm workspaces with a simpler, convention-based approach compared to Nx.

### Workspace Layout

```text
my-monorepo/
  apps/
    api/                      # NestJS application
      src/
        modules/
        common/
        main.ts
      package.json
      tsconfig.json
    web/                      # Frontend application
      package.json
  packages/
    config-typescript/        # Shared tsconfig presets
      nestjs.json
      react.json
      package.json
    config-eslint/            # Shared ESLint configs
      nestjs.js
      package.json
    shared-types/             # Shared TypeScript types
      src/
        user.ts
        pagination.ts
        index.ts
      package.json
    shared-validators/        # Shared validation schemas
      src/
        user.schema.ts
        index.ts
      package.json
    database/                 # Shared database package
      src/
        schema/
        drizzle.config.ts
        index.ts
      package.json
  turbo.json
  pnpm-workspace.yaml
  package.json
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "persistent": true,
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

### Package References

```json
// apps/api/package.json
{
  "name": "@my-monorepo/api",
  "dependencies": {
    "@my-monorepo/shared-types": "workspace:*",
    "@my-monorepo/shared-validators": "workspace:*",
    "@my-monorepo/database": "workspace:*"
  }
}
```

```typescript
// apps/api/src/modules/users/users.service.ts
import { User } from '@my-monorepo/shared-types';
import { createUserSchema } from '@my-monorepo/shared-validators';
import { db, users } from '@my-monorepo/database';
```

### Shared Package Pattern

```json
// packages/shared-types/package.json
{
  "name": "@my-monorepo/shared-types",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --build",
    "lint": "eslint src/"
  }
}
```

```typescript
// packages/shared-types/src/index.ts
export type { User, CreateUserInput, UpdateUserInput } from './user';
export type { PaginatedResponse, PaginationParams } from './pagination';
```

### Rules

- Keep `packages/` for shared code — each package has its own `package.json` and build step
- Use `workspace:*` for internal dependencies so pnpm links them automatically
- Shared types packages should export types only — no runtime dependencies
- Use `turbo.json` task dependencies (`^build`) to ensure packages build before apps
- Keep NestJS-specific code in `apps/api` — packages should be framework-agnostic where possible

---

## 19. E2E Test Organization

E2E tests live in a top-level `test/` directory and test full HTTP request/response cycles against a running application.

### File Structure

```text
test/
  jest-e2e.json               # E2E-specific Jest config
  setup.ts                    # Global setup (database, app bootstrap)
  teardown.ts                 # Global teardown (cleanup)
  helpers/
    test-app.helper.ts        # Shared app creation
    auth.helper.ts            # Token generation for authenticated requests
    database.helper.ts        # Seed/reset database
  users/
    users.e2e-spec.ts         # Users endpoint tests
    users.fixtures.ts         # Test data factories
  auth/
    auth.e2e-spec.ts
    auth.fixtures.ts
```

### Test App Helper

```typescript
// test/helpers/test-app.helper.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply the same pipes/interceptors as production
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  return app;
}
```

### E2E Test Structure

```typescript
// test/users/users.e2e-spec.ts
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/test-app.helper';
import { resetDatabase, seedUsers } from '../helpers/database.helper';
import { getAuthToken } from '../helpers/auth.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase();
    await seedUsers();
    authToken = await getAuthToken(app, 'admin@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /users', () => {
    it('should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(10);
          expect(res.body.meta.total).toBeDefined();
        });
    });

    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('POST /users', () => {
    it('should create a user and return 201', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'new@example.com', name: 'New User', password: 'Str0ng!Pass' })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('new@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'not-an-email', name: 'Bad' })
        .expect(400);
    });
  });
});
```

### Rules

- E2E tests go in `test/` at the project root — separate from unit tests
- Mirror the module structure inside `test/` (e.g., `test/users/`, `test/auth/`)
- Use a real database (test instance) — don't mock at the E2E level
- Apply the same global pipes, interceptors, and guards as production
- Reset database state in `beforeAll` or `beforeEach` — tests must not depend on order
- Keep fixture/helper files in `test/helpers/` for reuse across test suites

---

## 20. Unit Test File Organization

Unit tests live next to the source file they test. Every service, controller, and repository should have a `.spec.ts` file.

### File Placement

```text
modules/
  users/
    users.controller.ts
    users.controller.spec.ts      # ← next to source
    users.service.ts
    users.service.spec.ts
    users.repository.ts
    users.repository.spec.ts
    dto/
      create-user.dto.ts
      create-user.dto.spec.ts     # ← validate DTO decorators
```

### Service Test Structure

```typescript
// users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repository = module.get(UsersRepository);
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test' };
      repository.findById.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Controller Test Structure

```typescript
// users.controller.spec.ts
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(UsersController);
    service = module.get(UsersService);
  });

  it('should delegate to service and return result', async () => {
    const dto = { email: 'test@example.com', name: 'Test' };
    const created = { id: '1', ...dto };
    service.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(result).toEqual(created);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
```

### Rules

- Place `.spec.ts` files next to the source file — not in a separate `test/` directory
- Mock only direct dependencies — use `jest.Mocked<T>` for type-safe mocks
- Test behavior, not implementation — assert on return values and thrown exceptions
- One `describe` block per method, `it` blocks for each scenario
- Controller tests should be thin — verify delegation to service, not business logic
- Use `Test.createTestingModule` to leverage NestJS DI in tests

---

## 21. When to Split Modules

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

---

## 22. When to Split Services

A service that does too much becomes hard to test, hard to understand, and a merge conflict magnet.

### Split Signals

```text
Split a service when:
✓ More than ~300 lines
✓ Constructor has more than 5 dependencies
✓ Methods group into distinct clusters with separate concerns
✓ Some methods are reused by other modules, others are internal
✓ Test setup requires mocking 6+ dependencies
✓ The class name needs "And" to describe what it does
```

### Before: God Service

```typescript
// BAD: users.service.ts — authentication + profile + notifications
@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly argon: ArgonService,
    private readonly mailer: MailService,
    private readonly s3: S3Service,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async register(dto: RegisterDto) { /* hash password, create user, send welcome email */ }
  async login(dto: LoginDto) { /* verify password, generate tokens */ }
  async refreshToken(token: string) { /* validate, rotate */ }
  async updateProfile(id: string, dto: UpdateProfileDto) { /* update fields */ }
  async uploadAvatar(id: string, file: Buffer) { /* upload to S3, update URL */ }
  async changePassword(id: string, dto: ChangePasswordDto) { /* verify old, hash new */ }
  async sendPasswordReset(email: string) { /* generate token, send email */ }
  async getNotificationPreferences(id: string) { /* read from cache or DB */ }
  async updateNotificationPreferences(id: string, dto: NotifPrefsDto) { /* update, bust cache */ }
}
```

### After: Focused Services

```typescript
// GOOD: auth.service.ts — authentication only
@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly argon: ArgonService,
  ) {}

  async register(dto: RegisterDto) { /* ... */ }
  async login(dto: LoginDto) { /* ... */ }
  async refreshToken(token: string) { /* ... */ }
  async changePassword(userId: string, dto: ChangePasswordDto) { /* ... */ }
  async sendPasswordReset(email: string) { /* ... */ }
}

// GOOD: users-profile.service.ts — profile management
@Injectable()
export class UsersProfileService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly s3: S3Service,
  ) {}

  async updateProfile(id: string, dto: UpdateProfileDto) { /* ... */ }
  async uploadAvatar(id: string, file: Buffer) { /* ... */ }
}

// GOOD: notification-preferences.service.ts
@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly cache: CacheService,
  ) {}

  async get(userId: string) { /* ... */ }
  async update(userId: string, dto: NotifPrefsDto) { /* ... */ }
}
```

### Extraction Strategy

```text
1. Identify clusters — group methods by which dependencies they use
2. Name the new service — if you can't find a clear name, the split may be wrong
3. Move methods — extract to new service class
4. Update the module — register new providers, update exports
5. Update dependents — other services/controllers now inject the specific service
6. Verify tests — each new service should be independently testable with fewer mocks
```

### Rules

- Split by responsibility, not by size alone — a 400-line service with one clear responsibility is fine
- Each service should be describable in one sentence without "and"
- After splitting, the original module registers all resulting services
- If a split creates a service useful to multiple modules, consider moving it to a shared module
- Constructor injection count is a smell indicator: 3-4 is healthy, 6+ warrants review
- Prefer composition over inheritance — services call each other, don't extend each other

---
